import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);

interface ProjectInfo {
    type: 'maven' | 'gradle' | 'unknown';
    javaVersion?: string;
    springBootVersion?: string;
    dependencies: string[];
}

interface JavaVersionInfo {
    fullVersion: string;    // e.g., openjdk@17.0.9
    majorVersion: string;   // e.g., 17
    minorVersion: string;   // e.g., 0
    patchVersion: string;   // e.g., 9
    isLTS: boolean;
    vendor: string;         // e.g., openjdk, liberica, etc.
    buildNumber?: string;
}

function parseVersion(version: string): JavaVersionInfo {
    let vendor: string;
    let versionStr: string;
    
    // Handle version strings with and without vendor prefix
    if (version.includes('@')) {
        [vendor, versionStr] = version.split('@');
    } else {
        vendor = 'openjdk';
        versionStr = version;
    }
    
    // Handle Java version formats
    const parts = versionStr.split('.');
    const majorVersion = parts[0].replace(/^1\./, ''); // Handle Java 8 style versions
    const minorVersion = parts[1] || '0';
    const patchAndBuild = (parts[2] || '0').split('-');
    
    return {
        fullVersion: version,
        majorVersion,
        minorVersion,
        patchVersion: patchAndBuild[0],
        buildNumber: patchAndBuild[1],
        vendor: vendor.toLowerCase(),
        isLTS: ['8', '11', '17', '21'].includes(majorVersion)
    };
}

class JavaVersionTreeItem extends vscode.TreeItem {
    constructor(
        public readonly version: string,
        public readonly isGlobal: boolean,
        public readonly isLocal: boolean,
        public readonly isRecommended: boolean = false
    ) {
        super(version, vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'javaVersion';
        
        const versionInfo = parseVersion(version);
        
        // Simplified label showing just vendor and major version
        this.label = `${versionInfo.vendor === 'openjdk' ? 'OpenJDK' : versionInfo.vendor} ${versionInfo.majorVersion}`;
        
        // Simplified description showing just the version number
        this.description = `${versionInfo.majorVersion}.${versionInfo.minorVersion}.${versionInfo.patchVersion}`;
        
        // Set tooltip with detailed information
        this.tooltip = new vscode.MarkdownString();
        this.tooltip.appendMarkdown(`**${versionInfo.vendor === 'openjdk' ? 'OpenJDK' : versionInfo.vendor} ${versionInfo.majorVersion}**\n\n`);
        this.tooltip.appendMarkdown(`Full Version: ${versionInfo.majorVersion}.${versionInfo.minorVersion}.${versionInfo.patchVersion}\n`);
        if (versionInfo.buildNumber) this.tooltip.appendMarkdown(`Build: ${versionInfo.buildNumber}\n`);
        if (versionInfo.isLTS) this.tooltip.appendMarkdown(`✓ LTS Version\n`);
        if (isGlobal) this.tooltip.appendMarkdown('✓ Global Version\n');
        if (isLocal) this.tooltip.appendMarkdown('📁 Local Version\n');
        
        // Set icon based on status (simplified)
        const extensionPath = vscode.extensions.getExtension('appstecbr.jabba-manager-all')?.extensionPath || '';
        this.iconPath = {
            light: vscode.Uri.file(path.join(extensionPath, 'images', 'java-version.svg')),
            dark: vscode.Uri.file(path.join(extensionPath, 'images', 'java-version.svg'))
        };
    }
}

class JavaVersionProvider implements vscode.TreeDataProvider<JavaVersionTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<JavaVersionTreeItem | undefined | null | void> = new vscode.EventEmitter<JavaVersionTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<JavaVersionTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    private recommendedVersion: string | undefined;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    setRecommendedVersion(version: string | undefined): void {
        this.recommendedVersion = version;
        this.refresh();
    }

    async getTreeItem(element: JavaVersionTreeItem): Promise<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: JavaVersionTreeItem): Promise<JavaVersionTreeItem[]> {
        if (element) {
            return [];
        }

        try {
            const versionsOutput = await execAsync('jabba ls').catch(err => {
                console.error('Error executing jabba ls:', err);
                return { stdout: '' };
            });
            
            const currentGlobal = await execAsync('jabba current').catch(err => {
                console.error('Error executing jabba current:', err);
                return { stdout: '' };
            });
            
            const currentLocal = await execAsync('jabba which').catch(err => {
                console.error('Error executing jabba which:', err);
                return { stdout: '' };
            });
            
            // Safely get stdout or empty string
            const versionsStdout = versionsOutput?.stdout || '';
            const currentGlobalStdout = currentGlobal?.stdout || '';
            const currentLocalStdout = currentLocal?.stdout || '';

            const versions = versionsStdout ? versionsStdout.split('\n') : [];
            const filteredVersions = versions
                .filter(v => v.trim())
                .sort((a, b) => {
                    // Sort by version number, putting OpenJDK versions first
                    const aIsOpenJDK = a.toLowerCase().includes('openjdk');
                    const bIsOpenJDK = b.toLowerCase().includes('openjdk');
                    if (aIsOpenJDK && !bIsOpenJDK) return -1;
                    if (!aIsOpenJDK && bIsOpenJDK) return 1;
                    return b.localeCompare(a, undefined, { numeric: true });
                });

            return filteredVersions.map(version => {
                const isGlobal = version === currentGlobalStdout.trim();
                const isLocal = version === currentLocalStdout.trim();
                const isRecommended = version === this.recommendedVersion;
                return new JavaVersionTreeItem(version, isGlobal, isLocal, isRecommended);
            });
        } catch (error) {
            const errorMessage = String(error);
            let displayMessage = `Error getting Java versions: ${errorMessage}`;

            // Check if the error indicates 'jabba' command is not found
            if (errorMessage.includes('not recognized') || errorMessage.includes('command not found') || (process.platform === 'win32' && errorMessage.includes('ENOENT'))) {
                displayMessage += '\n\nIs Jabba installed and in your PATH? You might need to restart VS Code or your computer after installing Jabba.';
            }
            
            vscode.window.showErrorMessage(displayMessage);
            return [];
        }
    }
}

async function analyzeProject(): Promise<ProjectInfo> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return { type: 'unknown', dependencies: [] };
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const pomPath = path.join(rootPath, 'pom.xml');
    const gradlePath = path.join(rootPath, 'build.gradle');
    const gradleKtsPath = path.join(rootPath, 'build.gradle.kts');

    try {
        if (fs.existsSync(pomPath)) {
            const content = await readFileAsync(pomPath, 'utf8');
            const javaVersion = content.match(/<java.version>(.*?)<\/java.version>/)?.[1];
            const springBootVersion = content.match(/<spring-boot.version>(.*?)<\/spring-boot.version>/)?.[1];
            return {
                type: 'maven',
                javaVersion,
                springBootVersion,
                dependencies: []
            };
        } else if (fs.existsSync(gradlePath)) {
            const content = await readFileAsync(gradlePath, 'utf8');
            const javaVersion = content.match(/sourceCompatibility\s*=\s*['"](.+?)['"]/)?.[1];
            const springBootVersion = content.match(/spring-boot-gradle-plugin:(.+?)['"]]/)?.[1];
            return {
                type: 'gradle',
                javaVersion,
                springBootVersion,
                dependencies: []
            };
        }
    } catch (error) {
        console.error('Error analyzing project:', error);
    }

    return { type: 'unknown', dependencies: [] };
}

async function getLatestVersionForMajor(majorVersion: string): Promise<string | undefined> {
    try {
        // Explicitly query for OpenJDK versions with the specific major version
        const result = await execAsync(`jabba ls-remote openjdk@${majorVersion}`).catch(err => {
            console.error('Command execution failed:', err);
            return { stdout: '' };
        });
        
        if (!result || typeof result.stdout !== 'string' || !result.stdout.trim()) {
            console.log(`No remote versions found for ${majorVersion}, using fallback`);
            // Find a fallback version with the matching major version
            const fallbackVersion = fallbackVersions.find(v => {
                const vInfo = parseVersion(v);
                return vInfo.majorVersion === majorVersion;
            });
            return fallbackVersion || `openjdk@${majorVersion}`;
        }
        
        // Log the output for debugging
        console.log(`jabba ls-remote output for ${majorVersion}:`, result.stdout);
        
        const versionsOutput = result.stdout.split('\n');
        const versions = versionsOutput
            .map(line => line.trim())
            .filter(line => line && line.length > 0)
            .sort((a, b) => {
                // Parse version strings to compare
                const aVersion = a.split('@')[1] || '';
                const bVersion = b.split('@')[1] || '';
                return bVersion.localeCompare(aVersion, undefined, { numeric: true });
            });
            
        if (versions.length === 0) {
            console.log(`No OpenJDK versions found for major version ${majorVersion}`);
            // Find a fallback version with the matching major version
            const fallbackVersion = fallbackVersions.find(v => {
                const vInfo = parseVersion(v);
                return vInfo.majorVersion === majorVersion;
            });
            return fallbackVersion || `openjdk@${majorVersion}`;
        }
        
        return versions[0]; // Return the latest version
    } catch (error) {
        console.error('Error getting latest version:', error);
        // Find a fallback version with the matching major version
        const fallbackVersion = fallbackVersions.find(v => {
            const vInfo = parseVersion(v);
            return vInfo.majorVersion === majorVersion;
        });
        return fallbackVersion || `openjdk@${majorVersion}`;
    }
}

async function recommendJavaVersion(projectInfo: ProjectInfo): Promise<string> {
    let recommendedMajorVersion = '17'; // Default to Java 17 LTS

    if (projectInfo.springBootVersion) {
        // Spring Boot version-based recommendations
        const version = projectInfo.springBootVersion;
        if (version.startsWith('3.')) {
            recommendedMajorVersion = '17'; // Spring Boot 3.x requires Java 17+
        } else if (version.startsWith('2.')) {
            recommendedMajorVersion = '11'; // Spring Boot 2.x works well with Java 11
        }
    }

    if (projectInfo.javaVersion) {
        // Direct Java version specification
        const version = projectInfo.javaVersion;
        if (version.startsWith('21')) {
            recommendedMajorVersion = '21';
        } else if (version.startsWith('17')) {
            recommendedMajorVersion = '17';
        } else if (version.startsWith('11')) {
            recommendedMajorVersion = '11';
        } else if (version.startsWith('1.8') || version.startsWith('8')) {
            recommendedMajorVersion = '8';
        }
    }

    // Get the latest version for the recommended major version
    const latestVersion = await getLatestVersionForMajor(recommendedMajorVersion);
    return latestVersion || `openjdk@${recommendedMajorVersion}.0.0`; // Fallback if ls-remote fails
}

async function checkJabbaInstallation(): Promise<boolean> {
    try {
        await execAsync('jabba --version');
        return true;
    } catch (error) {
        const isWindows = process.platform === 'win32';
        const installAction = 'Install Jabba';
        const addToPathAction = 'Add to PATH';
        
        // Check if Jabba is installed but not in PATH
        const homeDir = os.homedir();
        const jabbaPath = isWindows 
            ? path.join(homeDir, '.jabba', 'bin', 'jabba.exe')
            : path.join(homeDir, '.jabba', 'bin', 'jabba');

        const jabbaExists = require('fs').existsSync(jabbaPath);
        
        if (jabbaExists) {
            // Jabba is installed but not in PATH
            const message = 'Jabba is not in PATH. Would you like to add it automatically?';
            const selection = await vscode.window.showWarningMessage(message, 'Add', 'Cancel');
            
            if (selection === 'Add') {
                try {
                    if (isWindows) {
                        // Add to User PATH using PowerShell
                        const jabbaPathForEnv = path.join('%USERPROFILE%', '.jabba', 'bin');
                        await execAsync(`powershell -Command "[System.Environment]::SetEnvironmentVariable('Path', [System.Environment]::GetEnvironmentVariable('Path', 'User') + ';${jabbaPathForEnv}', 'User')"`);
                        
                        // Update current session's PATH
                        await execAsync(`powershell -Command "$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')"`);
                        
                        vscode.window.showInformationMessage('Jabba has been added to PATH. Please restart VS Code for the changes to take effect.');
                        return true;
                    } else {
                        // For Unix-like systems
                        const profilePath = path.join(homeDir, '.profile');
                        const exportLine = `\nexport PATH="$HOME/.jabba/bin:$PATH"\n`;
                        fs.appendFileSync(profilePath, exportLine);
                        
                        vscode.window.showInformationMessage('Jabba has been added to PATH. Please restart your terminal and VS Code for the changes to take effect.');
                        return true;
                    }
                } catch (err) {
                    vscode.window.showErrorMessage(`Failed to add Jabba to PATH: ${err}`);
                    return false;
                }
            }
            return false;
        }
            
        // Jabba is not installed
        const message = 'Jabba is not installed. Would you like to install it?';
        const selection = await vscode.window.showErrorMessage(message, 'Install');
        
        if (selection === 'Install') {
            const terminal = vscode.window.createTerminal('Jabba Installation');
            terminal.show();
            
            if (isWindows) {
                terminal.sendText([
                    '[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;',
                    'Invoke-Expression (Invoke-WebRequest https://github.com/shyiko/jabba/raw/master/install.ps1 -UseBasicParsing).Content;',
                    '$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User");',
                    'Write-Host "Please restart VS Code after installation completes."'
                ].join(' '));
            } else {
                terminal.sendText([
                    'curl -sL https://github.com/shyiko/jabba/raw/master/install.sh | bash;',
                    'source ~/.jabba/jabba.sh;',
                    'echo "Please restart VS Code after installation completes."'
                ].join(' '));
            }
        }
        return false;
    }
}

async function getJavaVersions(): Promise<string[]> {
    try {
        const result = await execAsync('jabba ls').catch(err => {
            console.error('Command execution failed:', err);
            return { stdout: '' };
        });
        
        if (!result || typeof result.stdout !== 'string') {
            console.error('Invalid response from jabba ls:', result);
            return [];
        }
        
        return result.stdout.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    } catch (error) {
        console.error('Error getting Java versions:', error);
        return [];
    }
}

// Fallback OpenJDK versions in case remote call fails
const fallbackVersions = [
    'openjdk@1.21.0',
    'openjdk@1.17.0',
    'openjdk@1.11.0',
    'openjdk@1.8.0'
];

// Helper to convert between version formats
function convertToJabbaFormat(version: string): string {
    if (!version.includes('@')) {
        return version; // Already in correct format or not a valid version string
    }
    
    const [vendor, versionPart] = version.split('@');
    
    // Check if it's already in 1.x.y format
    if (versionPart.startsWith('1.')) {
        return version;
    }
    
    // Convert modern format (like 21.0.0) to jabba format (1.21.0)
    const parts = versionPart.split('.');
    return `${vendor}@1.${parts.join('.')}`;
}

// Helper to convert from jabba format to display format
function convertFromJabbaFormat(version: string): string {
    if (!version.includes('@')) {
        return version; // Not a valid version string
    }
    
    const [vendor, versionPart] = version.split('@');
    
    // Check if it's in 1.x.y format where x > 8
    if (versionPart.startsWith('1.')) {
        const parts = versionPart.substring(2).split('.');
        const majorVersion = parseInt(parts[0]);
        
        // For Java 9+ in 1.x.y format, convert to x.y.z
        if (majorVersion >= 9) {
            return `${vendor}@${majorVersion}.${parts.slice(1).join('.')}`;
        }
    }
    
    return version;
}

async function getAvailableJavaVersions(): Promise<{ label: string; description: string; jabbaVersion: string; info: JavaVersionInfo }[]> {
    try {
        // Use 'jabba ls-remote' to get versions (without any filters)
        const result = await execAsync('jabba ls-remote').catch(err => {
            console.error('Command execution failed:', err);
            return { stdout: '' };
        });
        
        let versionsOutput: string[] = [];
        
        if (!result || typeof result.stdout !== 'string' || !result.stdout.trim()) {
            console.warn('Invalid or empty response from jabba ls-remote, using fallback versions');
            versionsOutput = fallbackVersions;
        } else {
            // Log the output for debugging
            console.log('jabba ls-remote output:', result.stdout);
            versionsOutput = result.stdout.split('\n');
        }
        
        const versions = versionsOutput
            .map(line => line.trim())
            .filter(line => line && line.length > 0) // Filter out empty lines
            .map(versionString => {
                try {
                    // Convert to normalized format for display
                    const displayVersion = convertFromJabbaFormat(versionString);
                    const info = parseVersion(displayVersion);
                    
                    // Skip non-valid versions
                    if (!info.majorVersion) {
                        return null;
                    }
                    
                    return {
                        info,
                        label: displayVersion, // Display in modern format if applicable
                        jabbaVersion: versionString, // Keep original for install
                        description: `${info.vendor === 'openjdk' ? 'OpenJDK' : info.vendor} ${info.majorVersion}.${info.minorVersion}.${info.patchVersion}`
                    };
                } catch (err) {
                    console.error(`Error parsing version: ${versionString}`, err);
                    return null;
                }
            })
            .filter((item): item is { label: string; description: string; jabbaVersion: string; info: JavaVersionInfo } => item !== null) // Filter out failed parses with type guard
            .sort((a, b) => {
                // Sort by version numbers (newest first)
                return parseInt(b.info.majorVersion) - parseInt(a.info.majorVersion) ||
                       parseInt(b.info.minorVersion) - parseInt(a.info.minorVersion) ||
                       parseInt(b.info.patchVersion) - parseInt(a.info.patchVersion);
            });

        return versions;
    } catch (error) {
        console.error('Error fetching available versions:', error);
        
        // Use fallback versions when everything else fails
        return fallbackVersions.map(versionString => {
            const displayVersion = convertFromJabbaFormat(versionString);
            const info = parseVersion(displayVersion);
            return {
                info,
                label: displayVersion,
                jabbaVersion: versionString,
                description: `${info.vendor === 'openjdk' ? 'OpenJDK' : info.vendor} ${info.majorVersion}.${info.minorVersion}.${info.patchVersion}`
            };
        });
    }
}

async function setLocalJavaVersion(version: string): Promise<void> {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder is open');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const jabbaCommand = `jabba use ${version}`;
        
        // Execute jabba use command
        await execAsync(jabbaCommand, { cwd: workspaceRoot });
        
        // Create or update .jabbarc file in the workspace root
        const jabbarcPath = path.join(workspaceRoot, '.jabbarc');
        await fs.promises.writeFile(jabbarcPath, version);
        
        vscode.window.showInformationMessage(`Local Java version set to ${version}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to set local Java version: ${error}`);
    }
}

export async function activate(context: vscode.ExtensionContext) {
    // Check Jabba installation first
    const isJabbaInstalled = await checkJabbaInstallation();
    if (!isJabbaInstalled) {
        return;
    }

    const javaVersionProvider = new JavaVersionProvider();
    vscode.window.registerTreeDataProvider('jabbaManagerView', javaVersionProvider);

    // File watcher for project files
    const watcher = vscode.workspace.createFileSystemWatcher('**/{pom.xml,build.gradle,build.gradle.kts}');
    watcher.onDidChange(async () => {
        const config = vscode.workspace.getConfiguration('jabbaManager');
        if (config.get<boolean>('autoRecommend', true)) {
            const projectInfo = await analyzeProject();
            const recommendedVersion = await recommendJavaVersion(projectInfo);
            javaVersionProvider.setRecommendedVersion(recommendedVersion);
        }
    });

    let recommendVersion = vscode.commands.registerCommand('jabba-manager.recommendVersion', async () => {
        try {
            const projectInfo = await analyzeProject();
            const recommendedVersion = await recommendJavaVersion(projectInfo);

            const message = `Java version for this project: ${recommendedVersion}`;
            const action = await vscode.window.showInformationMessage(
                message,
                'Add',
                'Switch',
                'Dismiss'
            );

            if (action === 'Add') {
                await vscode.commands.executeCommand('jabba-manager.installOpenJDK', recommendedVersion);
            } else if (action === 'Switch') {
                const jabbaVersion = convertToJabbaFormat(recommendedVersion);
                await execAsync(`jabba use ${jabbaVersion}`);
                vscode.window.showInformationMessage(`Switched to Java version: ${recommendedVersion}`);
                javaVersionProvider.refresh();
            }
        } catch (error) {
            vscode.window.showErrorMessage('Error recommending Java version: ' + error);
        }
    });

    let refreshVersions = vscode.commands.registerCommand('jabba-manager.refreshVersions', () => {
        javaVersionProvider.refresh();
    });

    let installOpenJDK = vscode.commands.registerCommand('jabba-manager.installOpenJDK', async () => {
        try {
            // Show a loading message
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Fetching available Java versions...",
                cancellable: false
            }, async () => {
                try {
                    const availableVersions = await getAvailableJavaVersions();
                    
                    if (availableVersions.length === 0) {
                        vscode.window.showWarningMessage('No Java versions found via \'jabba ls-remote\'. Please check your internet connection and jabba installation.');
                        return;
                    }
                    
                    // Create quick pick with enhanced items including jabbaVersion
                    interface JavaVersionQuickPickItem extends vscode.QuickPickItem {
                        jabbaVersion: string;
                    }
                    
                    const quickPick = vscode.window.createQuickPick<JavaVersionQuickPickItem>();
                    quickPick.placeholder = 'Select Java version to install';
                    quickPick.items = availableVersions.map(version => ({
                        label: version.label,
                        description: version.description,
                        jabbaVersion: version.jabbaVersion,
                        iconPath: {
                            light: vscode.Uri.file(path.join(context.extensionPath, 'images', 'commands', 'light', 'install.svg')),
                            dark: vscode.Uri.file(path.join(context.extensionPath, 'images', 'commands', 'dark', 'install.svg'))
                        }
                    }));
                    
                    quickPick.onDidChangeSelection(async selection => {
                        const selected = selection[0];
                        if (!selected) return;
                        
                        quickPick.hide();
                        const displayVersion = selected.label;
                        const installVersion = selected.jabbaVersion;
                        
                        try {
                            await vscode.window.withProgress({
                                location: vscode.ProgressLocation.Notification,
                                title: `Installing ${displayVersion}`,
                                cancellable: false
                            }, async () => {
                                try {
                                    console.log(`Installing Java version with command: jabba install ${installVersion}`);
                                    await execAsync(`jabba install ${installVersion}`);
                                } catch (err) {
                                    console.error(`Failed to install ${installVersion}:`, err);
                                    throw err;
                                }
                            });
                            
                            vscode.window.showInformationMessage(`Successfully installed ${displayVersion}`);
                            javaVersionProvider.refresh();
                        } catch (error) {
                            vscode.window.showErrorMessage(`Failed to install ${displayVersion}: ${error}`);
                        }
                    });
                    
                    quickPick.show();
                } catch (error) {
                    vscode.window.showErrorMessage(`Error fetching available versions: ${error}`);
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error installing Java version: ${error}`);
        }
    });

    let switchJavaVersion = vscode.commands.registerCommand('jabba-manager.switchJavaVersion', async () => {
        try {
            const installedVersions = await getJavaVersions();
            if (installedVersions.length === 0) {
                vscode.window.showInformationMessage('No Java versions installed via Jabba yet.');
                return;
            }

            const quickPick = vscode.window.createQuickPick();
            quickPick.placeholder = 'Select Java version to switch to';
            quickPick.items = installedVersions.map(version => {
                const versionInfo = parseVersion(version);
                return {
                    label: version,
                    description: `${versionInfo.vendor === 'openjdk' ? 'OpenJDK' : versionInfo.vendor} ${versionInfo.majorVersion}.${versionInfo.minorVersion}.${versionInfo.patchVersion}`,
                    iconPath: {
                        light: vscode.Uri.file(path.join(context.extensionPath, 'images', 'commands', 'light', 'switch.svg')),
                        dark: vscode.Uri.file(path.join(context.extensionPath, 'images', 'commands', 'dark', 'switch.svg'))
                    }
                };
            });

            quickPick.onDidChangeSelection(async selection => {
                const selected = selection[0];
                if (!selected) return;
                
                quickPick.hide();
                try {
                    const version = selected.label;
                    await execAsync(`jabba use ${version}`);
                    vscode.window.showInformationMessage(`Switched to Java version: ${version}`);
                    javaVersionProvider.refresh();
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to switch version: ${error}`);
                }
            });

            quickPick.show();
        } catch (error) {
            vscode.window.showErrorMessage('Error switching Java version: ' + error);
        }
    });

    let setGlobalVersion = vscode.commands.registerCommand('jabba-manager.setGlobalVersion', async (item: JavaVersionTreeItem) => {
        try {
            // Using 'jabba alias default' to set the global version
            await execAsync(`jabba alias default ${item.version}`);
            vscode.window.showInformationMessage(`Set global Java version to: ${item.version}`);
            javaVersionProvider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to set global version: ${error}`);
        }
    });

    let setLocalVersion = vscode.commands.registerCommand('jabba-manager.setLocalVersion', async (item: JavaVersionTreeItem) => {
        if (item) {
            await setLocalJavaVersion(item.version);
            javaVersionProvider.refresh();
        }
    });

    let uninstallVersion = vscode.commands.registerCommand('jabba-manager.uninstallVersion', async (item: JavaVersionTreeItem) => {
        try {
            const answer = await vscode.window.showWarningMessage(
                `Are you sure you want to uninstall ${item.version}?`,
                { modal: true },
                'Remove',
                'Cancel'
            );

            if (answer === 'Remove') {
                // Using 'jabba uninstall' to remove a version
                await execAsync(`jabba uninstall ${item.version}`);
                vscode.window.showInformationMessage(`Uninstalled Java version: ${item.version}`);
                javaVersionProvider.refresh();
            }
        } catch (error) {
            vscode.window.showErrorMessage('Error uninstalling Java version: ' + error);
        }
    });

    context.subscriptions.push(
        watcher,
        recommendVersion,
        refreshVersions,
        installOpenJDK,
        switchJavaVersion,
        setGlobalVersion,
        uninstallVersion,
        setLocalVersion
    );
}

export function deactivate() {}
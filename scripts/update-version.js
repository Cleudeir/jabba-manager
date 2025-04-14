const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Get current version and parse it
const [major, minor, patch] = package.version.split('.').map(Number);

// Always increment patch version
package.version = `${major}.${minor}.${patch + 1}`;

// Write updated package.json
fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + '\n');

// Clean up old VSIX files
const workspaceDir = path.join(__dirname, '..');
fs.readdirSync(workspaceDir)
    .filter(file => file.endsWith('.vsix'))
    .forEach(file => {
        fs.unlinkSync(path.join(workspaceDir, file));
        console.log(`Cleaned up old VSIX file: ${file}`);
    });

console.log(`Version updated to ${package.version}`);

// Optional: Verify Jabba installation (only if JABBA_VERIFY environment variable is set)
if (process.env.JABBA_VERIFY === 'true') {
    const { execSync } = require('child_process');
    try {
        const jabbaVersion = execSync('jabba --version').toString().trim();
        console.log(`✓ Jabba is installed and its version is: ${jabbaVersion}`);
    } catch (error) {
        console.warn('⚠️ Jabba verification skipped:');
        console.warn('   Jabba is not available in the current PATH. This is normal during development.');
        console.warn('   To use Jabba, make sure it is installed and available in your system PATH.');
        console.warn('   For Windows users, you may need to restart your terminal after installation.');
    }
}
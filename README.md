# Jabba Manager for VS Code

> **Note**: This is an unofficial VS Code extension for [Jabba](https://github.com/shyiko/jabba), a cross-platform Java Version Manager.

## Features

- 🔍 View installed Java versions
- ⚡ Quick switching between Java versions
- 📦 Install new Java versions
- 🌍 Set global default Java version
- 📁 Set local Java version per workspace

## Prerequisites

- [Jabba](https://github.com/shyiko/jabba) must be installed on your system
- VS Code version 1.60.0 or higher

## Installation

1. Install Jabba following the [official instructions](https://github.com/shyiko/jabba#installation)
2. Install this extension from the VS Code Marketplace
3. Restart VS Code

## Usage

The extension adds a new activity bar icon (Java icon) that opens the Jabba Manager view. From there you can:

- View all installed Java versions.
  - The version currently set as the local default for the workspace (via `.jabbarc`) will be marked with a folder icon (`$(folder)`).
  - The version set as the global default is marked with a '✓'.
- **Click on any version** in the list to set it as the local version for the current workspace (this will create or update the `.jabbarc` file in your workspace root).
- Use the context menu (right-click) on a version for more actions:
  - Set as Global Default
  - Uninstall Version
- Use the buttons in the view's title bar:
  - `Add Java Version`: Install a new Java version.
  - `Switch Java Version`: Change the current global Java version (using `jabba use`).
  - `Refresh Versions`: Update the list of installed versions.

## How it Works

This extension interacts with your existing Jabba installation to manage Java versions within the VS Code environment. Here's a brief overview:

- **Leverages Jabba CLI:** The core functionality relies on executing `jabba` commands (like `jabba ls`, `jabba install`, `jabba use`, `jabba uninstall`) in a terminal process managed by VS Code. You won't see the terminal directly, but the extension uses it to list, install, switch, and remove JDKs.
- **Workspace Configuration (`.jabbarc`):** When you set a Java version for a specific workspace (by clicking on it in the Jabba Manager view), the extension creates or modifies a `.jabbarc` file in the root of your workspace. This file simply contains the name of the Jabba-managed JDK to use for that project, allowing Jabba to automatically select the correct version when you work within that folder.
- **Global Configuration:** Actions like "Set as Global Default" modify Jabba's global configuration, affecting which Java version is used by default outside of workspaces with a specific `.jabbarc` file.

## Commands

- `Add Java Version`: Install a new Java version
- `Switch Java Version`: Change the current Java version
- `Set Global Default`: Set the default Java version for all projects
- `Remove Java Version`: Uninstall a Java version
- `Refresh Versions`: Update the list of installed versions

## Configuration

The extension can be configured through VS Code settings:

- `jabbaManager.defaultJavaVersion`: Default Java version to use
- `jabbaManager.showVersionDetails`: Show detailed version information in the tree view

## About Jabba

This extension is built on top of [Jabba](https://github.com/shyiko/jabba), a cross-platform Java Version Manager inspired by nvm (Node.js). Jabba provides a unified experience for installing and switching between different versions of JDK across different operating systems.

### Supported Java Distributions

- OpenJDK
- Oracle JDK
- Oracle Server JRE
- Adopt OpenJDK (Hotspot & Eclipse OpenJ9)
- Zulu OpenJDK
- IBM SDK
- GraalVM CE
- Liberica JDK
- Amazon Corretto

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Disclaimer

This is an unofficial extension and is not affiliated with or endorsed by the Jabba project. All trademarks and registered trademarks are the property of their respective owners.
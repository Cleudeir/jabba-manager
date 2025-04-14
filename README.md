# Jabba Manager for VS Code

[![Version](https://img.shields.io/visual-studio-marketplace/v/Cleudeir.jabba-manager.svg)](https://marketplace.visualstudio.com/items?itemName=Cleudeir.jabba-manager)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/Cleudeir.jabba-manager.svg)](https://marketplace.visualstudio.com/items?itemName=Cleudeir.jabba-manager)

> **Note**: This is an unofficial VS Code extension for [Jabba](https://github.com/shyiko/jabba), a cross-platform Java Version Manager.

## Features

- 🔍 View installed Java versions
- ⚡ Quick switching between Java versions
- 📦 Install new Java versions
- 🌍 Set global default Java version
- 📁 Set local Java version per workspace
- 🔄 Automatic version recommendations based on project configuration
- 🎯 Support for OpenJDK and other Java distributions

## Prerequisites

- [Jabba](https://github.com/shyiko/jabba) must be installed on your system
- VS Code version 1.60.0 or higher

## Installation

1. Install Jabba following the [official instructions](https://github.com/shyiko/jabba#installation)
2. Install this extension from the VS Code Marketplace
3. Restart VS Code

## Usage

The extension adds a new activity bar icon (Java icon) that opens the Jabba Manager view. From there you can:

- View all installed Java versions
- Install new versions
- Switch between versions
- Set global default version
- Set local version for the current workspace
- Uninstall versions

### Commands

- `Add Java Version`: Install a new Java version
- `Switch Java Version`: Change the current Java version
- `Set Global Default`: Set the default Java version for all projects
- `Set Local Version`: Set Java version for the current workspace
- `Remove Java Version`: Uninstall a Java version
- `Refresh Versions`: Update the list of installed versions

## Configuration

The extension can be configured through VS Code settings:

- `jabbaManager.defaultOpenJDKVersion`: Default OpenJDK version to use
- `jabbaManager.showVersionDetails`: Show detailed version information in the tree view
- `jabbaManager.autoRecommend`: Automatically recommend Java version when project files change
- `jabbaManager.recommendOnCompile`: Show Java version recommendations when compiling the project

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
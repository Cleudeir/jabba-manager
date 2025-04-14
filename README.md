A VSCode extension for managing Java versions using Jabba, with a focus on OpenJDK management.

![Jabba Manager](images/java-icon.png)

## Features

- Install OpenJDK versions directly from VSCode
- Switch between installed Java versions with a single click
- Manage (use/uninstall) Java versions through an intuitive interface
- Quick access to common Jabba commands
- Automatic detection of project Java requirements

## Prerequisites

Before using this extension, you need to install Jabba:

### Installing Jabba

#### Windows
```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-Expression (
  Invoke-WebRequest https://github.com/shyiko/jabba/raw/master/install.ps1 -UseBasicParsing
).Content
```

#### macOS / Linux
```bash
curl -sL https://github.com/shyiko/jabba/raw/master/install.sh | bash && . ~/.jabba/jabba.sh
```

**Note:** After installing Jabba, restart your computer or at least your VS Code instance to ensure the `jabba` command is available in the system PATH.

## Installation

### From Visual Studio Code Marketplace
1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "Jabba Manager"
4. Click "Install"

### From Source
1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press F5 to start debugging the extension

## Usage

### Available Commands
The extension provides the following commands through the Command Palette (Ctrl+Shift+P or Cmd+Shift+P):

- `Jabba: Manage Java Versions` - View and manage installed Java versions
- `Jabba: Install OpenJDK Version` - Install a new OpenJDK version
- `Jabba: Switch Java Version` - Quickly switch between installed Java versions

### Basic Workflow
1. Install Jabba (if not already installed)
2. Install Java versions using the `Jabba: Install OpenJDK Version` command
3. Switch between Java versions using the `Jabba: Switch Java Version` command
4. Manage installed versions using the `Jabba: Manage Java Versions` command

## Configuration

You can configure the extension in your VSCode settings:

```json
{
    "jabbaManager.defaultOpenJDKVersion": "openjdk@1.17.0",
    "jabbaManager.showStatusBarItem": true,
    "jabbaManager.checkForUpdates": true
}
```

## Supported OpenJDK Versions

This extension supports all OpenJDK versions available through Jabba. Some common versions include:
- OpenJDK 8
- OpenJDK 11
- OpenJDK 17
- OpenJDK 21

## Troubleshooting

### Common Issues

#### Jabba command not found
Ensure Jabba is properly installed and your terminal session has been restarted.

#### Cannot switch Java version
Make sure the version is installed. Run `jabba ls` in your terminal to list installed versions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

This project is licensed under the MIT License - a permissive license that allows anyone to use, modify, distribute, and sell this software, provided that the original copyright notice and permission notice are included in all copies or substantial portions of the software. It also comes with no warranty or liability for the authors.
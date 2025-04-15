# Simple script to read .jabbarc and set both local and global Java versions
Write-Host "Reading Java version from .jabbarc file..." -ForegroundColor Cyan

# Check if .jabbarc exists
if (-not (Test-Path ".jabbarc")) {
    Write-Host "Error: .jabbarc file not found in current directory." -ForegroundColor Red
    exit 1
}

# Read the version from .jabbarc
$version = Get-Content ".jabbarc" -Raw | ForEach-Object { $_.Trim() }
if (-not $version) {
    Write-Host "Error: .jabbarc file is empty or contains invalid version." -ForegroundColor Red
    exit 1
}

Write-Host "Found version: $version" -ForegroundColor Green

# Initialize Jabba
$env:JABBA_HOME = "$env:USERPROFILE\.jabba"
. "$env:JABBA_HOME\jabba.ps1"

# Set as local version
Write-Host "Setting local Java version to $version..." -ForegroundColor Yellow
jabba use $version

# Set as global default
Write-Host "Setting global Java version to $version..." -ForegroundColor Yellow
jabba alias default $version

# Update environment variables
$env:JAVA_HOME = jabba which $version
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

Write-Host "Java version set successfully!" -ForegroundColor Green
java -version

Write-Host "`nTo use this command directly, run: " -ForegroundColor Cyan
Write-Host "   . .\set-jabba-version.ps1" -ForegroundColor Yellow 
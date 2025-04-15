# This script is for immediate use in the current terminal
Write-Host "Applying Java version from .jabbarc to current terminal..." -ForegroundColor Green

$jabbaRcFile = ".jabbarc"
if (-not (Test-Path $jabbaRcFile)) {
    Write-Host "Error: .jabbarc file not found." -ForegroundColor Red
    exit 1
}

$javaVersion = Get-Content $jabbaRcFile -Raw
$javaVersion = $javaVersion.Trim()
Write-Host "Found version in .jabbarc: $javaVersion" -ForegroundColor Cyan

# Set up environment directly in the current session
$env:JABBA_HOME = "$env:USERPROFILE\.jabba"
. "$env:JABBA_HOME\jabba.ps1"

Write-Host "Setting Java version to: $javaVersion" -ForegroundColor Yellow
jabba use $javaVersion
jabba alias default $javaVersion

$env:JAVA_HOME = jabba which $javaVersion
Write-Host "JAVA_HOME set to: $env:JAVA_HOME" -ForegroundColor Cyan

$env:Path = "$env:JAVA_HOME\bin;$env:Path"

Write-Host "Java version is now:" -ForegroundColor Green
java -version 
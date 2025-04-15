Write-Host "Syncing Java version with .jabbarc..." -ForegroundColor Green

$jabbaRcFile = ".jabbarc"
if (-not (Test-Path $jabbaRcFile)) {
    Write-Host "Error: .jabbarc file not found." -ForegroundColor Red
    exit 1
}

$javaVersion = Get-Content $jabbaRcFile -Raw
$javaVersion = $javaVersion.Trim()
Write-Host "Found version in .jabbarc: $javaVersion" -ForegroundColor Cyan

# Create a PowerShell profile if it doesn't exist
if (-not (Test-Path $PROFILE)) {
    New-Item -Path $PROFILE -ItemType File -Force | Out-Null
    Write-Host "Created PowerShell profile at $PROFILE" -ForegroundColor Yellow
}

# Add the sync-java function to the profile
$functionContent = @"

# Function to sync Java version with .jabbarc
function Sync-Java {
    param(
        [string]`$Version
    )
    
    if (-not `$Version) {
        # Try to read from .jabbarc in the current directory
        if (Test-Path ".jabbarc") {
            `$Version = Get-Content ".jabbarc" -Raw
            `$Version = `$Version.Trim()
        }
        else {
            Write-Host "Error: No version specified and no .jabbarc file found." -ForegroundColor Red
            return
        }
    }
    
    Write-Host "Setting Java version to: `$Version" -ForegroundColor Yellow
    
    `$env:JABBA_HOME = "`$env:USERPROFILE\.jabba"
    . "`$env:JABBA_HOME\jabba.ps1"
    
    jabba use `$Version
    jabba alias default `$Version
    
    `$env:JAVA_HOME = jabba which `$Version
    Write-Host "JAVA_HOME set to: `$env:JAVA_HOME" -ForegroundColor Cyan
    
    `$env:Path = "`$env:JAVA_HOME\bin;`$env:Path"
    
    Write-Host "Java version is now:" -ForegroundColor Green
    java -version
}

# Create an alias for easier use
Set-Alias -Name sjava -Value Sync-Java

"@

# Check if the function already exists in the profile
$profileContent = Get-Content $PROFILE -Raw -ErrorAction SilentlyContinue
if (-not ($profileContent -match "function Sync-Java")) {
    Add-Content -Path $PROFILE -Value $functionContent
    Write-Host "Added Sync-Java function to your PowerShell profile" -ForegroundColor Green
}

# Now sync the Java version
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

Write-Host "`n===================================================="
Write-Host "IMPORTANT: To use this Java version in any PowerShell terminal:"
Write-Host ""
Write-Host "1. Close and reopen your PowerShell terminal"
Write-Host "2. Run either of these commands:" -ForegroundColor Yellow
Write-Host "   Sync-Java" -ForegroundColor Yellow
Write-Host "   sjava" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will sync Java to the version in .jabbarc"
Write-Host "===================================================="

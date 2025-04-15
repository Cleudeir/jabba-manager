@echo off
echo Reading Java version from .jabbarc file...

REM Check if .jabbarc exists
if not exist ".jabbarc" (
    echo Error: .jabbarc file not found in current directory.
    exit /b 1
)

REM Read the version from .jabbarc
set /p VERSION=<.jabbarc
echo Found version: %VERSION%

REM Initialize Jabba
set JABBA_HOME=%USERPROFILE%\.jabba
call "%JABBA_HOME%\jabba.ps1"

REM Set as local version
echo Setting local Java version to %VERSION%...
jabba use %VERSION%

REM Set as global default
echo Setting global Java version to %VERSION%...
jabba alias default %VERSION%

REM Update environment variables
for /f "tokens=*" %%i in ('jabba which %VERSION%') do set JAVA_HOME=%%i
set PATH=%JAVA_HOME%\bin;%PATH%

echo Java version set successfully!
java -version

echo.
echo To use this command directly, run:
echo    call set-jabba-version.bat 
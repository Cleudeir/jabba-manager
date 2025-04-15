@echo off
echo Syncing Java version with .jabbarc...

set "JABBARC_FILE=.jabbarc"
if not exist "%JABBARC_FILE%" (
    echo Error: .jabbarc file not found.
    exit /b 1
)

set /p JAVA_VERSION=<"%JABBARC_FILE%"
echo Found version in .jabbarc: %JAVA_VERSION%

set JABBA_HOME=%USERPROFILE%\.jabba
call "%JABBA_HOME%\jabba.ps1"

echo Setting Java version to: %JAVA_VERSION%
jabba use %JAVA_VERSION%
jabba alias default %JAVA_VERSION%

set JAVA_HOME=
for /f "tokens=*" %%i in ('jabba which %JAVA_VERSION%') do set JAVA_HOME=%%i
echo JAVA_HOME set to: %JAVA_HOME%

set PATH=%JAVA_HOME%\bin;%PATH%

echo Java version is now:
java -version

echo.
echo ====================================================
echo To use this Java version in the current terminal:
echo Copy and paste this command:
echo.
echo call sync-java.bat
echo.
echo ====================================================

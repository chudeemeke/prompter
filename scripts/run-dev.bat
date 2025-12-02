@echo off
echo Setting up environment...

REM Add Cargo to PATH
set PATH=C:\Users\Destiny\.cargo\bin;%PATH%

REM Load Visual Studio environment
call "C:\Program Files\Microsoft Visual Studio\2022\Preview\Common7\Tools\VsDevCmd.bat" -no_logo

echo.
echo Starting Prompter dev server...
echo Press Ctrl+Shift+Space to open Prompter (or Alt+P as fallback)
echo.

npm run tauri dev

@echo off
echo ========================================
echo Prompter Development Build
echo ========================================
echo.

REM Set up environment
echo [1/4] Setting up Cargo path...
set PATH=C:\Users\Destiny\.cargo\bin;%PATH%

echo [2/4] Loading Visual Studio environment...
call "C:\Program Files\Microsoft Visual Studio\2022\Preview\Common7\Tools\VsDevCmd.bat" -no_logo

echo [3/4] Cleaning previous build...
cd /d "C:\dev\prompter\src-tauri"
cargo clean

echo.
echo [4/4] Starting Tauri dev server...
echo ========================================
echo Press Ctrl+Shift+Space to open Prompter
echo (Fallbacks: Alt+P or Ctrl+`)
echo ========================================
echo.

cd /d "C:\dev\prompter"
npm run tauri dev

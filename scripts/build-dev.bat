@echo off
echo ========================================
echo Prompter Development Build
echo ========================================
echo.

REM [1/3] Set up Visual Studio environment using vcvarsall.bat
echo [1/3] Setting up MSVC environment (x64)...
call "C:\Program Files\Microsoft Visual Studio\2022\Preview\VC\Auxiliary\Build\vcvarsall.bat" x64
if errorlevel 1 (
    echo ERROR: Failed to set up Visual Studio environment
    echo Please ensure Visual Studio 2022 is installed with C++ workload
    pause
    exit /b 1
)

REM [2/3] Ensure Cargo is on PATH
echo [2/3] Adding Cargo to PATH...
set PATH=C:\Users\Destiny\.cargo\bin;%PATH%

REM Verify tools are available
echo.
echo Verifying tools...
where link.exe
where cargo.exe

echo.
echo [3/3] Starting Tauri dev server...
echo ========================================
echo Press Ctrl+Shift+Space to open Prompter
echo (Fallbacks: Alt+P or Ctrl+`)
echo ========================================
echo.

cd /d "C:\dev\prompter"
npm run tauri dev

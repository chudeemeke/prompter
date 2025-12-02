@echo off
echo ========================================
echo Prompter - Dev Server
echo ========================================
echo.

REM Set up Visual Studio 2026 Community environment
echo [1/3] Loading MSVC environment (x64)...
call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvarsall.bat" x64
if errorlevel 1 (
    echo ERROR: Failed to load Visual Studio environment
    echo Please verify Visual Studio 2026 Community is installed
    pause
    exit /b 1
)

REM Add Cargo to PATH
echo [2/3] Adding Rust toolchain to PATH...
set PATH=C:\Users\Destiny\.cargo\bin;%PATH%

REM Verify critical tools
echo.
echo Verifying build tools...
where link.exe | findstr /i "Microsoft Visual Studio"
where cargo.exe

echo.
echo [3/3] Starting Tauri dev server...
echo ========================================
echo Use System Tray icon to open Prompter
echo (All hotkeys unavailable - registered by other apps)
echo ========================================
echo.

cd /d "C:\dev\prompter"
npm run tauri dev

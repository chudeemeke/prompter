@echo off
set PATH=%USERPROFILE%\.cargo\bin;%PATH%
cd /d "c:\Users\Destiny\iCloudDrive\Documents\AI Tools\Anthropic Solution\Projects\prompter"
call npm run tauri:build

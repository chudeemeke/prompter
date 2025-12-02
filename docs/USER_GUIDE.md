# Prompter - User Guide

## Quick Start

### Launching the App

**During Development:**
- Run: `C:\dev\prompter\run-tauri.bat`
- Or: Open CMD in `C:\dev\prompter` and run `npm run tauri dev`

**After Build (Production):**
- Start Menu → Prompter
- Desktop shortcut (if created during install)
- Automatically on Windows startup (if enabled in settings)

### Accessing Prompter

Since all keyboard hotkeys are currently taken by other apps on your system, use:
- **System Tray Icon** (bottom-right corner) - Click to open
- **Right-click menu**:
  - "Show Prompter" - Opens the main window
  - "Settings..." - Opens preferences (to be implemented)
  - "Quit" - Closes the application

## Basic Usage

### Searching for Prompts
1. Type in the search box (auto-focused)
2. Use **Arrow Keys** (↑↓) to navigate results
3. Press **Enter** to select a prompt
4. If prompt has variables, fill them in the modal
5. Prompt text is copied to clipboard (and auto-pasted if enabled)

### Managing Prompts

**Add New Prompt:**
1. Create a markdown file in `C:\Users\Destiny\.prompter\prompts\[FolderName]\`
2. Follow the format:
```markdown
---
name: My Prompt
description: What this prompt does
folder: Coding
icon: 📝
color: #3B82F6
tags: [tag1, tag2]
auto_paste: true
created_at: 2025-12-02T00:00:00Z
updated_at: 2025-12-02T00:00:00Z
variables:
  - name: variable_name
    default: default_value
    required: true
---

This is the prompt content with {{variable_name}}.
```

**Edit Prompt:**
- Open the `.md` file in any text editor
- Save changes - Prompter will reload automatically (or restart if needed)

**Delete Prompt:**
- Delete the `.md` file from the prompts directory

## Shutdown & Restart

### Normal Shutdown
1. Right-click system tray icon
2. Click "Quit"

### Force Quit (if app hangs)
1. Press `Ctrl+Shift+Esc` (Task Manager)
2. Find "app.exe" or "Prompter.exe"
3. Right-click → End Task

### Restart After Shutdown

**Development:**
- Run `C:\dev\prompter\run-tauri.bat` again

**Production:**
- Click Start Menu → Prompter
- Or double-click desktop shortcut

## Keyboard Shortcuts

### In Main Window
- **Arrow Keys** (↑↓) - Navigate prompts
- **Enter** - Select highlighted prompt
- **Esc** - Close window
- **Tab** - Fill variables (when modal open)
- **Type** - Search/filter prompts

### Global Hotkeys
Currently **ALL hotkeys are taken** by other apps on your system:
- ❌ F9, F10, F11, F12
- ❌ Ctrl+Shift+Space
- ❌ Ctrl+Alt+Space
- ❌ Ctrl+Shift+K
- ❌ Ctrl+Shift+;
- ❌ Alt+P
- ❌ Ctrl+`

**Workaround**: Use system tray icon to open Prompter

**Future**: Settings window will allow custom hotkey configuration

## Settings (Coming Soon)

Access via: Right-click tray → "Settings..."

**Available Settings:**
- Auto-start on Windows login
- Theme (Dark/Light/Auto)
- Custom hotkey configuration
- Prompts directory path
- Auto-paste behavior
- Window opacity
- And more...

See [SETTINGS_PLAN.md](./SETTINGS_PLAN.md) for full details.

## File Locations

### Prompts Directory
```
C:\Users\Destiny\.prompter\prompts\
├── Coding\
│   ├── architecture-review.md
│   ├── debug-assistant.md
│   └── ...
├── Research\
│   └── ...
└── Writing\
    └── ...
```

### Configuration
```
C:\Users\Destiny\.prompter\
├── config.json          # Settings (to be implemented)
├── usage.json           # Frecency tracking
└── prompts\             # Your prompts
```

### Application Files
```
C:\dev\prompter\                     # Development
C:\Program Files\Prompter\           # Production install (future)
C:\Users\Destiny\AppData\Local\Prompter\  # Logs (future)
```

## Troubleshooting

### App Won't Start
1. Check if already running in Task Manager
2. Kill existing process if found
3. Try running as Administrator
4. Check logs in CMD window for errors

### No Prompts Showing
1. Verify prompts exist in `~/.prompter/prompts/`
2. Check YAML frontmatter format is correct
3. Look for parsing errors in CMD window
4. Ensure folder names match `folder:` field in YAML

### Hotkeys Not Working
- **This is expected** - all tested hotkeys are already registered by other apps
- Use system tray icon instead
- Wait for Settings implementation to configure custom hotkeys

### System Tray Icon Missing
1. Check if app is actually running (Task Manager)
2. Look in "hidden icons" (↑ arrow in notification area)
3. Restart the app
4. If persistent, check CMD window for tray icon errors

### Window Won't Close
- Press `Esc` key
- Click outside the window
- Right-click tray → Quit
- Task Manager → End Task (last resort)

## Tips & Best Practices

1. **Organize by Folders**: Use Coding/Research/Writing folders to categorize prompts
2. **Use Variables**: Make prompts reusable with `{{variable_name}}` placeholders
3. **Auto-paste**: Set `auto_paste: true` for prompts you frequently paste
4. **Descriptive Names**: Use clear, searchable prompt names
5. **Tags**: Add tags for better searchability
6. **Icons**: Use emoji icons for visual identification

## Getting Help

- **Documentation**: See `docs/` folder in project
- **Settings Plan**: [SETTINGS_PLAN.md](./SETTINGS_PLAN.md)
- **Architecture**: [PLAN.md](../PLAN.md)
- **Issues**: Report bugs via GitHub (when repository is public)

## Keyboard Maestro / AutoHotkey Alternative

Until custom hotkeys are implemented, you can use:

**AutoHotkey Script** (Windows):
```ahk
; Custom hotkey to launch Prompter
^!p::  ; Ctrl+Alt+P
Run, "C:\dev\prompter\run-tauri.bat"
return
```

**PowerShell Shortcut**:
```powershell
# Create a shortcut with this target:
powershell.exe -WindowStyle Hidden -Command "Start-Process 'C:\dev\prompter\run-tauri.bat'"
```

## Next Steps

1. **Test Core Features**: Search, select, paste
2. **Settings Implementation**: Auto-start, hotkeys, preferences
3. **Build & Package**: Create MSI installer
4. **Production Testing**: Install on fresh system
5. **Documentation**: Complete user guide

## Version History

**v0.1.0** (Current - Development)
- Initial implementation
- 12 prompts loaded successfully
- System tray with icon and menu
- Search and navigation working
- Paste functionality (to be tested)
- Settings menu added (UI to be implemented)

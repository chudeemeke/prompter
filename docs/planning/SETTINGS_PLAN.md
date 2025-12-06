# Settings System - Implementation Plan

## Overview
Professional settings/preferences system inspired by Raycast, VS Code, Alfred, and 1Password.

## User Journey

### Access Settings
- **System Tray**: Right-click → "Settings..." ✅ DONE
- **Keyboard Shortcut**: Ctrl+, (future enhancement)

### Settings Window
- **Size**: 800px × 600px
- **Style**: Frameless with custom title bar, centered
- **Navigation**: Sidebar with icons + tabs
- **Apply**: Save button + instant preview where applicable

## Settings Categories

### 1. General
```yaml
Settings:
  - Auto-start on Windows login (toggle)
    - Registry key: HKCU\Software\Microsoft\Windows\CurrentVersion\Run
    - Value: Path to Prompter.exe

  - Show in system tray (toggle, requires restart)
    - Default: true

  - Theme (dropdown)
    - Options: Auto (system), Light, Dark
    - Default: Auto

  - Language (dropdown)
    - Options: English (only for now)
    - Future: Multi-language support
```

### 2. Hotkeys
```yaml
Settings:
  - Global hotkey (hotkey picker)
    - Show all 9 attempted hotkeys with status
    - Green checkmark: Available
    - Red X: Already registered
    - Allow custom hotkey configuration

  - Hotkey registration status (read-only list)
    - F9: ❌ Taken by [OtherApp]
    - F11: ❌ Taken by [OtherApp]
    - etc.

  - Reset to defaults button
```

### 3. Prompts
```yaml
Settings:
  - Prompts directory (folder picker)
    - Default: ~/.prompter/prompts
    - Button: "Choose Folder..."
    - Show current path

  - Auto-paste behavior (toggle)
    - Default: Enabled
    - Description: "Automatically paste prompt after selection"

  - Show folders in search (toggle)
    - Default: Enabled
    - Show folder badges (Coding, Research, etc.)

  - Reload prompts button
    - Manual refresh if files changed externally
```

### 4. Appearance
```yaml
Settings:
  - Window opacity (slider)
    - Range: 70% - 100%
    - Default: 95%

  - Blur background (toggle)
    - Default: Enabled

  - Animation speed (dropdown)
    - Options: Fast, Normal, Slow, Off
    - Default: Normal

  - Results per page (number input)
    - Range: 5 - 20
    - Default: 10
```

### 5. Advanced
```yaml
Settings:
  - Log level (dropdown)
    - Options: Error, Warn, Info, Debug, Trace
    - Default: Info

  - Data directory (folder picker)
    - Default: ~/.prompter
    - Show: config.json, usage.json, logs/

  - Export settings (button)
    - Creates prompter-settings.json

  - Import settings (button)
    - Loads from prompter-settings.json

  - Reset to defaults (button)
    - Warning dialog before reset

  - About section
    - Version: v0.1.0
    - GitHub link
    - License: MIT
```

## Technical Implementation

### Architecture

```
src-tauri/src/
├── commands/
│   ├── settings.rs          # NEW - Settings CRUD commands
│   └── mod.rs
├── storage/
│   ├── domain/
│   │   └── entities/
│   │       └── settings.rs  # NEW - Settings entity
│   └── infrastructure/
│       └── persistence/
│           └── settings_repository.rs  # NEW - Load/save config.json
└── lib.rs                    # Register settings commands

src/
├── components/
│   └── SettingsWindow/      # NEW - Settings UI
│       ├── index.tsx
│       ├── Sidebar.tsx
│       ├── GeneralTab.tsx
│       ├── HotkeysTab.tsx
│       ├── PromptsTab.tsx
│       ├── AppearanceTab.tsx
│       └── AdvancedTab.tsx
└── services/
    └── SettingsService.ts   # NEW - Settings API client
```

### Settings Storage

**File**: `~/.prompter/config.json`

```json
{
  "version": "1.0.0",
  "general": {
    "autoStart": false,
    "showInTray": true,
    "theme": "auto",
    "language": "en"
  },
  "hotkeys": {
    "globalHotkey": "F9",
    "customHotkeys": []
  },
  "prompts": {
    "directory": "C:\\Users\\Destiny\\.prompter\\prompts",
    "autoPaste": true,
    "showFolders": true
  },
  "appearance": {
    "opacity": 95,
    "blurBackground": true,
    "animationSpeed": "normal",
    "resultsPerPage": 10
  },
  "advanced": {
    "logLevel": "info",
    "dataDirectory": "C:\\Users\\Destiny\\.prompter"
  }
}
```

### Tauri Commands

```rust
// src-tauri/src/commands/settings.rs

#[tauri::command]
pub fn get_settings() -> Result<Settings, String> {
    // Load from ~/.prompter/config.json
}

#[tauri::command]
pub fn save_settings(settings: Settings) -> Result<(), String> {
    // Save to ~/.prompter/config.json
}

#[tauri::command]
pub fn reset_settings() -> Result<Settings, String> {
    // Reset to defaults
}

#[tauri::command]
pub fn export_settings(path: String) -> Result<(), String> {
    // Export to custom location
}

#[tauri::command]
pub fn import_settings(path: String) -> Result<Settings, String> {
    // Import from custom location
}

#[tauri::command]
pub fn set_auto_start(enabled: bool) -> Result<(), String> {
    // Add/remove from Windows startup registry
    // HKCU\Software\Microsoft\Windows\CurrentVersion\Run
}
```

### React Component Structure

```typescript
// src/components/SettingsWindow/index.tsx

export function SettingsWindow({ service }: SettingsWindowProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    service.getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    await service.saveSettings(settings);
    // Show success toast
  };

  return (
    <div className="settings-window">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="settings-content">
        {activeTab === 'general' && <GeneralTab settings={settings} onChange={setSettings} />}
        {activeTab === 'hotkeys' && <HotkeysTab settings={settings} onChange={setSettings} />}
        {activeTab === 'prompts' && <PromptsTab settings={settings} onChange={setSettings} />}
        {activeTab === 'appearance' && <AppearanceTab settings={settings} onChange={setSettings} />}
        {activeTab === 'advanced' && <AdvancedTab settings={settings} onChange={setSettings} />}
      </div>
      <div className="settings-footer">
        <button onClick={handleSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
```

## UI Design Inspiration

### Raycast
- Clean sidebar navigation
- Instant preview of changes
- Keyboard-first navigation
- Search settings feature

### VS Code
- JSON + UI editor hybrid
- Color picker for themes
- Hotkey recorder
- Clear setting descriptions

### Alfred
- Tabbed interface
- Visual hotkey picker
- Import/export presets
- License management

### 1Password
- Modern, clean design
- Toggle switches for booleans
- Dropdown menus for enums
- Clear section headers

## Implementation Phases

### Phase 1: Infrastructure (2-3 hours)
- [ ] Create Settings entity with validation
- [ ] Implement SettingsRepository (load/save config.json)
- [ ] Add Tauri commands (get_settings, save_settings)
- [ ] Create basic SettingsWindow component
- [ ] Add sidebar navigation

### Phase 2: General Tab (1 hour)
- [ ] Auto-start toggle
- [ ] Theme selector
- [ ] Show in tray toggle

### Phase 3: Hotkeys Tab (2 hours)
- [ ] Show all attempted hotkeys with status
- [ ] Custom hotkey picker
- [ ] Registration status indicator

### Phase 4: Prompts Tab (1 hour)
- [ ] Directory picker
- [ ] Auto-paste toggle
- [ ] Show folders toggle

### Phase 5: Appearance Tab (1-2 hours)
- [ ] Opacity slider
- [ ] Blur toggle
- [ ] Animation speed selector

### Phase 6: Advanced Tab (1 hour)
- [ ] Log level selector
- [ ] Export/import settings
- [ ] Reset to defaults
- [ ] About section

### Phase 7: Auto-Start Implementation (2 hours)
- [ ] Windows registry integration
- [ ] Add/remove startup entry
- [ ] Test on actual restart

### Phase 8: Polish (1-2 hours)
- [ ] Animations
- [ ] Toast notifications
- [ ] Settings search
- [ ] Keyboard shortcuts

## Total Estimated Time: 11-15 hours

## Testing Checklist

- [ ] Settings persist across restarts
- [ ] Auto-start works on Windows login
- [ ] Theme changes apply immediately
- [ ] Hotkey changes register correctly
- [ ] Prompts directory change reloads prompts
- [ ] Export/import preserves all settings
- [ ] Reset to defaults works
- [ ] Settings window closes properly

## Future Enhancements

- Settings sync across devices (cloud backup)
- Custom CSS/themes
- Plugins/extensions system
- Hotkey profiles (work/personal)
- Backup/restore settings history
- Settings search (like VS Code)

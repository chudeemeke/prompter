# Agent B: OS Integration Layer (Hexagonal Architecture)

You are implementing the **OS Integration Layer** for Prompter using **Hexagonal Architecture** with **Ports & Adapters** pattern.

## Your Mission

Build Windows-specific OS integration with clean architecture separation:
- **Domain Layer**: Ports (interfaces) for OS operations
- **Application Layer**: Use cases orchestrating OS interactions
- **Infrastructure Layer**: Windows API adapters
- **Presentation Layer**: Tauri commands (thin wrappers)

You work INDEPENDENTLY - no dependencies on other agents.

---

## Architecture Overview

```
src-tauri/src/
├── domain/
│   └── ports/
│       ├── clipboard_service.rs    # Clipboard interface (trait)
│       ├── window_manager.rs       # Window focus interface (trait)
│       └── input_simulator.rs      # Keyboard input interface (trait)
├── application/
│   └── use_cases/
│       ├── paste_prompt.rs         # Paste prompt use case
│       └── show_window.rs          # Show window use case
└── infrastructure/
    └── os/
        ├── windows_clipboard.rs    # Windows clipboard adapter
        ├── windows_focus.rs        # Windows focus tracker adapter
        └── windows_input.rs        # Windows SendInput adapter
```

**Dependency Direction:**
```
Infrastructure (Windows APIs) → Application → Domain
```

**Critical Rule:** Domain ports define interfaces, Infrastructure implements them.

---

## Context

Prompter workflow:
1. User working in app (VS Code, Chrome)
2. Press `Ctrl+Space` (global hotkey)
3. Prompter window appears
4. User selects prompt
5. Copy → Hide → Restore focus → Paste (Ctrl+V simulation)

Your job: Steps 2-5 at the OS level.

---

## File Boundaries (STRICT)

```
OWNS (create/modify freely):
  src-tauri/src/domain/ports/
  ├── clipboard_service.rs
  ├── window_manager.rs
  └── input_simulator.rs

  src-tauri/src/application/use_cases/
  ├── paste_prompt.rs
  └── show_window.rs

  src-tauri/src/infrastructure/os/
  ├── windows_clipboard.rs
  ├── windows_focus.rs
  └── windows_input.rs

  src-tauri/src/commands/
  └── clipboard.rs          # Thin wrapper calling use cases

MODIFIES (specific sections only):
  src-tauri/src/main.rs          # Hotkey registration, tray setup
  src-tauri/tauri.conf.json      # Window configuration
  src-tauri/capabilities/default.json  # Permissions

READ ONLY:
  src-tauri/src/commands/mod.rs  # Data structures
  src-tauri/Cargo.toml           # Dependencies
```

---

## 1. Domain Layer (Ports/Interfaces)

### `domain/ports/window_manager.rs`

```rust
/// Window management interface (Port)
/// Platform-specific implementations will be in Infrastructure layer
pub trait WindowManager: Send + Sync {
    /// Remember the currently focused window
    fn remember_current_window(&self) -> Result<(), String>;

    /// Restore focus to previously remembered window
    fn restore_previous_window(&self) -> Result<(), String>;

    /// Clear saved window reference
    fn clear_saved_window(&self);
}
```

### `domain/ports/clipboard_service.rs`

```rust
/// Clipboard operations interface (Port)
pub trait ClipboardService: Send + Sync {
    /// Write text to system clipboard
    fn write_text(&self, text: &str) -> Result<(), String>;

    /// Read text from system clipboard
    fn read_text(&self) -> Result<String, String>;
}
```

### `domain/ports/input_simulator.rs`

```rust
/// Keyboard input simulation interface (Port)
pub trait InputSimulator: Send + Sync {
    /// Simulate Ctrl+V keystroke
    fn simulate_paste(&self) -> Result<(), String>;

    /// Simulate arbitrary key combination
    fn simulate_keys(&self, keys: &[KeyCode]) -> Result<(), String>;
}

#[derive(Debug, Clone, Copy)]
pub enum KeyCode {
    Control,
    V,
    // Extensible for future use
}
```

---

## 2. Application Layer (Use Cases)

### `application/use_cases/paste_prompt.rs`

```rust
use crate::domain::ports::{ClipboardService, WindowManager, InputSimulator};
use std::sync::Arc;

/// Paste prompt use case
/// Orchestrates: Copy → Hide → Restore focus → Paste
pub struct PastePromptUseCase {
    clipboard: Arc<dyn ClipboardService>,
    window_manager: Arc<dyn WindowManager>,
    input_simulator: Arc<dyn InputSimulator>,
}

impl PastePromptUseCase {
    pub fn new(
        clipboard: Arc<dyn ClipboardService>,
        window_manager: Arc<dyn WindowManager>,
        input_simulator: Arc<dyn InputSimulator>,
    ) -> Self {
        Self {
            clipboard,
            window_manager,
            input_simulator,
        }
    }

    pub async fn execute(&self, text: &str, auto_paste: bool) -> Result<(), String> {
        // Step 1: Copy text to clipboard
        self.clipboard.write_text(text)?;

        // Step 2: Small delay for clipboard sync
        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

        // Step 3: Restore focus to previous window
        self.window_manager.restore_previous_window()?;

        // Step 4: Optionally simulate paste
        if auto_paste {
            tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
            self.input_simulator.simulate_paste()?;
        }

        // Step 5: Cleanup
        self.window_manager.clear_saved_window();

        Ok(())
    }
}
```

### `application/use_cases/show_window.rs`

```rust
use crate::domain::ports::WindowManager;
use std::sync::Arc;

/// Show window use case
/// Orchestrates: Remember current window → Show Prompter window
pub struct ShowWindowUseCase {
    window_manager: Arc<dyn WindowManager>,
}

impl ShowWindowUseCase {
    pub fn new(window_manager: Arc<dyn WindowManager>) -> Self {
        Self { window_manager }
    }

    pub fn execute(&self) -> Result<(), String> {
        // Remember the window that's currently focused
        self.window_manager.remember_current_window()?;
        Ok(())
    }
}
```

---

## 3. Infrastructure Layer (Windows Adapters)

### `infrastructure/os/windows_focus.rs`

```rust
use crate::domain::ports::WindowManager;
use windows::Win32::Foundation::HWND;
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, SetForegroundWindow};
use std::sync::Mutex;
use once_cell::sync::Lazy;

static PREVIOUS_WINDOW: Lazy<Mutex<Option<isize>>> = Lazy::new(|| Mutex::new(None));

/// Windows implementation of WindowManager (Adapter)
pub struct WindowsFocusTracker;

impl WindowsFocusTracker {
    pub fn new() -> Self {
        Self
    }
}

impl WindowManager for WindowsFocusTracker {
    fn remember_current_window(&self) -> Result<(), String> {
        let hwnd = unsafe { GetForegroundWindow() };
        if !hwnd.is_invalid() {
            *PREVIOUS_WINDOW.lock().unwrap() = Some(hwnd.0 as isize);
            Ok(())
        } else {
            Err("Could not get foreground window".to_string())
        }
    }

    fn restore_previous_window(&self) -> Result<(), String> {
        let handle = PREVIOUS_WINDOW.lock().unwrap();
        if let Some(hwnd_val) = *handle {
            let hwnd = HWND(hwnd_val as *mut _);
            unsafe {
                SetForegroundWindow(hwnd);
            }
            Ok(())
        } else {
            Err("No previous window saved".to_string())
        }
    }

    fn clear_saved_window(&self) {
        *PREVIOUS_WINDOW.lock().unwrap() = None;
    }
}
```

### `infrastructure/os/windows_clipboard.rs`

```rust
use crate::domain::ports::ClipboardService;
use tauri::Manager;
use tauri_plugin_clipboard_manager::ClipboardExt;

/// Windows implementation of ClipboardService (Adapter)
/// Note: Uses Tauri's clipboard plugin which is cross-platform
pub struct TauriClipboardAdapter {
    app_handle: tauri::AppHandle,
}

impl TauriClipboardAdapter {
    pub fn new(app_handle: tauri::AppHandle) -> Self {
        Self { app_handle }
    }
}

impl ClipboardService for TauriClipboardAdapter {
    fn write_text(&self, text: &str) -> Result<(), String> {
        self.app_handle
            .clipboard()
            .write_text(text)
            .map_err(|e| format!("Clipboard write error: {}", e))
    }

    fn read_text(&self) -> Result<String, String> {
        self.app_handle
            .clipboard()
            .read_text()
            .map_err(|e| format!("Clipboard read error: {}", e))
    }
}
```

### `infrastructure/os/windows_input.rs`

```rust
use crate::domain::ports::{InputSimulator, KeyCode};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_KEYBOARD, KEYBDINPUT,
    KEYEVENTF_KEYUP, VIRTUAL_KEY, VK_CONTROL, VK_V,
};

/// Windows implementation of InputSimulator (Adapter)
pub struct WindowsInputSimulator;

impl WindowsInputSimulator {
    pub fn new() -> Self {
        Self
    }

    fn keycode_to_vk(&self, key: KeyCode) -> VIRTUAL_KEY {
        match key {
            KeyCode::Control => VK_CONTROL,
            KeyCode::V => VK_V,
        }
    }
}

impl InputSimulator for WindowsInputSimulator {
    fn simulate_paste(&self) -> Result<(), String> {
        self.simulate_keys(&[KeyCode::Control, KeyCode::V])
    }

    fn simulate_keys(&self, keys: &[KeyCode]) -> Result<(), String> {
        let mut inputs = Vec::new();

        // Press all keys (key down events)
        for key in keys {
            inputs.push(INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: self.keycode_to_vk(*key),
                        wScan: 0,
                        dwFlags: windows::Win32::UI::Input::KeyboardAndMouse::KEYBD_EVENT_FLAGS(0),
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            });
        }

        // Release all keys in reverse order (key up events)
        for key in keys.iter().rev() {
            inputs.push(INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: self.keycode_to_vk(*key),
                        wScan: 0,
                        dwFlags: KEYEVENTF_KEYUP,
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            });
        }

        let expected_count = inputs.len();
        let result = unsafe {
            SendInput(&inputs, std::mem::size_of::<INPUT>() as i32)
        };

        if result == expected_count as u32 {
            Ok(())
        } else {
            Err(format!("SendInput failed: sent {}/{} inputs", result, expected_count))
        }
    }
}
```

---

## 4. Presentation Layer (Tauri Commands)

### `commands/clipboard.rs`

```rust
use crate::application::use_cases::PastePromptUseCase;
use crate::infrastructure::os::{
    TauriClipboardAdapter,
    WindowsFocusTracker,
    WindowsInputSimulator,
};
use std::sync::Arc;
use tauri::Manager;

/// Copy text, hide window, restore focus, optionally paste
#[tauri::command]
pub async fn copy_and_paste(
    app: tauri::AppHandle,
    text: String,
    auto_paste: bool,
) -> Result<(), String> {
    // Construct adapters (infrastructure layer)
    let clipboard = Arc::new(TauriClipboardAdapter::new(app.clone()));
    let window_manager = Arc::new(WindowsFocusTracker::new());
    let input_simulator = Arc::new(WindowsInputSimulator::new());

    // Get window reference
    let window = app.get_webview_window("main")
        .ok_or("Could not find main window")?;

    // Hide window before use case execution
    window.hide().map_err(|e| format!("Hide error: {}", e))?;
    tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

    // Execute use case
    let use_case = PastePromptUseCase::new(clipboard, window_manager, input_simulator);
    use_case.execute(&text, auto_paste).await
}

/// Just hide window and restore focus (for Escape key)
#[tauri::command]
pub async fn hide_and_restore(app: tauri::AppHandle) -> Result<(), String> {
    let window = app.get_webview_window("main")
        .ok_or("Could not find main window")?;

    window.hide().map_err(|e| format!("Hide error: {}", e))?;
    tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

    let window_manager = WindowsFocusTracker::new();
    window_manager.restore_previous_window()?;
    window_manager.clear_saved_window();

    Ok(())
}
```

---

## 5. Global Hotkey & Tray Setup

### `main.rs` modifications

```rust
use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
use crate::infrastructure::os::WindowsFocusTracker;
use crate::domain::ports::WindowManager;
use std::sync::Arc;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // Register global hotkey: Ctrl+Space
            let shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::Space);

            let app_handle = app.handle().clone();
            let window_manager = Arc::new(WindowsFocusTracker::new());

            app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, _event| {
                if let Some(window) = app_handle.get_webview_window("main") {
                    // Use case: Show window
                    let _ = window_manager.remember_current_window();

                    // Show and focus window
                    let _ = window.show();
                    let _ = window.set_focus();

                    // Emit event to frontend
                    let _ = window.emit("focus-search", ());
                }
            })?;

            app.global_shortcut().register(shortcut)?;

            // Set up system tray
            setup_tray(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            crate::commands::clipboard::copy_and_paste,
            crate::commands::clipboard::hide_and_restore,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::{
        menu::{Menu, MenuItem},
        tray::TrayIconBuilder,
    };

    let show = MenuItem::with_id(app, "show", "Show Prompter", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show, &quit])?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("Prompter - Ctrl+Space")
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let wm = WindowsFocusTracker::new();
                        let _ = wm.remember_current_window();
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "quit" => app.exit(0),
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::DoubleClick { .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let wm = WindowsFocusTracker::new();
                    let _ = wm.remember_current_window();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}
```

---

## Dependencies

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-global-shortcut = "2"
tauri-plugin-clipboard-manager = "2"
tokio = { version = "1", features = ["time"] }
once_cell = "1"

[target.'cfg(windows)'.dependencies]
windows = { version = "0.58", features = [
    "Win32_Foundation",
    "Win32_UI_WindowsAndMessaging",
    "Win32_UI_Input_KeyboardAndMouse",
]}
```

---

## Capabilities Configuration

`src-tauri/capabilities/default.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-show",
    "core:window:allow-hide",
    "core:window:allow-set-focus",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister",
    "global-shortcut:allow-is-registered",
    "clipboard-manager:allow-write-text",
    "clipboard-manager:allow-read-text"
  ]
}
```

---

## Window Configuration

`tauri.conf.json`:

```json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Prompter",
        "width": 700,
        "height": 500,
        "resizable": false,
        "decorations": false,
        "transparent": true,
        "center": true,
        "visible": false,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "focus": false
      }
    ],
    "trayIcon": {
      "iconPath": "icons/icon.png",
      "iconAsTemplate": false
    }
  }
}
```

---

## Success Criteria

```
[ ] Domain ports defined (WindowManager, ClipboardService, InputSimulator traits)
[ ] Use cases orchestrate operations (PastePromptUseCase, ShowWindowUseCase)
[ ] Windows adapters implement ports
[ ] No Windows API code in domain or application layers
[ ] Ctrl+Space shows window
[ ] Window appears centered, on top
[ ] Previous window focus remembered and restored
[ ] Escape hides window, restores focus
[ ] Auto-paste simulates Ctrl+V correctly
[ ] System tray appears with menu
[ ] Can swap Windows adapters for macOS/Linux without changing domain
```

---

## Testing Strategy

```rust
// Domain layer tests (no platform dependencies)
#[cfg(test)]
mod domain_tests {
    use crate::domain::ports::*;

    struct MockWindowManager;
    impl WindowManager for MockWindowManager {
        // Mock implementation for testing
    }

    #[test]
    fn use_case_calls_window_manager() {
        let mock_wm = Arc::new(MockWindowManager);
        let use_case = ShowWindowUseCase::new(mock_wm);
        assert!(use_case.execute().is_ok());
    }
}

// Integration tests (Windows only)
#[cfg(all(test, target_os = "windows"))]
mod windows_tests {
    #[test]
    fn windows_focus_tracker_remembers_window() {
        let tracker = WindowsFocusTracker::new();
        assert!(tracker.remember_current_window().is_ok());
    }
}
```

---

## Benefits of This Architecture

1. **Platform Independence**: Domain layer has no Windows dependencies
2. **Testability**: Mock adapters for unit tests
3. **Extensibility**: Add macOS/Linux adapters without changing domain
4. **Single Responsibility**: Each layer has clear purpose
5. **Dependency Inversion**: High-level logic doesn't depend on low-level platform APIs

---

## Report Back

When complete, report:
1. **Architecture validation**: Dependency direction correct?
2. **Files created**: List all modules
3. **Platform abstraction**: Windows-specific code isolated?
4. **Test coverage**: Percentage covered
5. **Design patterns used**: Adapter, Use Case, etc.
6. **Any deviations from plan**

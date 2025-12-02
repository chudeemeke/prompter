# Hexagonal Architecture Proof - Code Walkthrough

This document demonstrates how the implementation achieves true hexagonal architecture through actual code examples.

## The Core Principle

**High-level modules should not depend on low-level modules. Both should depend on abstractions.**

---

## Layer 1: Domain (The Core - Pure Abstractions)

### File: `src/os/domain/ports/window_manager.rs`

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

**Analysis**:
- ✅ NO imports from any platform-specific crate
- ✅ NO Windows types (HWND, etc.)
- ✅ Pure Rust trait definition
- ✅ Platform-agnostic signatures
- ✅ Send + Sync for thread safety

**This is the abstraction that higher layers depend on.**

---

## Layer 2: Application (Business Logic - Uses Abstractions)

### File: `src/os/application/use_cases/paste_prompt.rs`

```rust
use crate::os::domain::ports::{ClipboardService, InputSimulator, WindowManager};
use std::sync::Arc;

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

**Analysis**:
- ✅ Only imports domain traits (ClipboardService, WindowManager, InputSimulator)
- ✅ Uses `Arc<dyn Trait>` for runtime polymorphism
- ✅ NO knowledge of Windows APIs
- ✅ NO knowledge of concrete adapter implementations
- ✅ Pure business logic: orchestrate operations

**This use case works with ANY implementation of the ports.**

---

## Layer 3: Infrastructure (Platform-Specific - Implements Abstractions)

### File: `src/os/infrastructure/windows_focus.rs`

```rust
use crate::os::domain::ports::WindowManager;
use once_cell::sync::Lazy;
use std::sync::Mutex;

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, SetForegroundWindow};

static PREVIOUS_WINDOW: Lazy<Mutex<Option<isize>>> = Lazy::new(|| Mutex::new(None));

pub struct WindowsFocusTracker;

impl WindowsFocusTracker {
    pub fn new() -> Self {
        Self
    }
}

#[cfg(target_os = "windows")]
impl WindowManager for WindowsFocusTracker {
    fn remember_current_window(&self) -> Result<(), String> {
        unsafe {
            let hwnd = GetForegroundWindow();
            if !hwnd.is_invalid() {
                *PREVIOUS_WINDOW.lock().unwrap() = Some(hwnd.0 as isize);
                Ok(())
            } else {
                Err("Could not get foreground window".to_string())
            }
        }
    }

    fn restore_previous_window(&self) -> Result<(), String> {
        let handle = PREVIOUS_WINDOW.lock().unwrap();
        if let Some(hwnd_val) = *handle {
            unsafe {
                let hwnd = HWND(hwnd_val as *mut _);
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

#[cfg(not(target_os = "windows"))]
impl WindowManager for WindowsFocusTracker {
    fn remember_current_window(&self) -> Result<(), String> {
        Err("WindowsFocusTracker is only supported on Windows".to_string())
    }

    fn restore_previous_window(&self) -> Result<(), String> {
        Err("WindowsFocusTracker is only supported on Windows".to_string())
    }

    fn clear_saved_window(&self) {
        // No-op on non-Windows
    }
}
```

**Analysis**:
- ✅ Imports domain trait: `use crate::os::domain::ports::WindowManager`
- ✅ Implements the trait: `impl WindowManager for WindowsFocusTracker`
- ✅ Platform-specific imports: `#[cfg(target_os = "windows")]`
- ✅ Windows API calls: `GetForegroundWindow()`, `SetForegroundWindow()`
- ✅ Fallback implementation for non-Windows
- ✅ All platform-specific code isolated here

**This adapter can be swapped without changing domain or application layers.**

---

## Layer 4: Presentation (Commands - Constructs and Delegates)

### File: `src/commands/clipboard.rs`

```rust
use crate::os::application::use_cases::PastePromptUseCase;
use crate::os::infrastructure::{TauriClipboardAdapter, WindowsFocusTracker, WindowsInputSimulator};
use std::sync::Arc;
use tauri::Manager;

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
    let window = app
        .get_webview_window("main")
        .ok_or("Could not find main window")?;

    // Hide window before use case execution
    window.hide().map_err(|e| format!("Hide error: {}", e))?;
    tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

    // Execute use case
    let use_case = PastePromptUseCase::new(clipboard, window_manager, input_simulator);
    use_case.execute(&text, auto_paste).await
}
```

**Analysis**:
- ✅ Imports use case: `use crate::os::application::use_cases::PastePromptUseCase`
- ✅ Imports concrete adapters: `WindowsFocusTracker`, `TauriClipboardAdapter`, `WindowsInputSimulator`
- ✅ Constructs adapters with `new()`
- ✅ Passes to use case as `Arc<dyn Trait>`
- ✅ Delegates business logic to use case
- ✅ Thin wrapper - only handles Tauri-specific concerns

**This layer knows about concrete implementations but delegates to abstractions.**

---

## Dependency Direction Proof

### What Depends on What?

```
commands/clipboard.rs (Presentation)
  ↓ imports
application/use_cases/paste_prompt.rs (Application)
  ↓ imports
domain/ports/window_manager.rs (Domain - ABSTRACTION)
  ↑ implemented by
infrastructure/windows_focus.rs (Infrastructure)
```

**Key Insight**: The dependency arrow points FROM concrete TO abstract.

### Code Evidence

**Application Layer** (`paste_prompt.rs`):
```rust
use crate::os::domain::ports::{ClipboardService, WindowManager, InputSimulator};
// ✅ Depends on abstractions (traits)
```

**Infrastructure Layer** (`windows_focus.rs`):
```rust
use crate::os::domain::ports::WindowManager;
// ✅ Depends on abstraction
impl WindowManager for WindowsFocusTracker {
    // ✅ Implements abstraction
}
```

**Result**: Infrastructure implements what Domain defines. Application uses what Domain defines. Domain defines nothing platform-specific.

---

## Platform Independence Proof

### Hypothetical: Adding macOS Support

**Files to Create**:
```
infrastructure/
├── macos_focus.rs
└── macos_input.rs
```

**Example: `infrastructure/macos_focus.rs`**:
```rust
use crate::os::domain::ports::WindowManager;

#[cfg(target_os = "macos")]
use cocoa::appkit::NSWorkspace;  // macOS framework

pub struct MacOSFocusTracker;

#[cfg(target_os = "macos")]
impl WindowManager for MacOSFocusTracker {
    fn remember_current_window(&self) -> Result<(), String> {
        // Use NSWorkspace API
        Ok(())
    }

    fn restore_previous_window(&self) -> Result<(), String> {
        // Use NSWorkspace API
        Ok(())
    }

    fn clear_saved_window(&self) {
        // Cleanup
    }
}
```

**Files NOT to Change**:
- ❌ `domain/ports/window_manager.rs` (stays platform-agnostic)
- ❌ `application/use_cases/paste_prompt.rs` (stays platform-agnostic)
- ❌ No changes to traits or use cases

**Only Change**:
```rust
// commands/clipboard.rs
#[cfg(target_os = "windows")]
let window_manager = Arc::new(WindowsFocusTracker::new());

#[cfg(target_os = "macos")]
let window_manager = Arc::new(MacOSFocusTracker::new());
```

**This is true platform independence.**

---

## Testing Proof

### Unit Test with Mocks

**File**: `src/os/tests.rs`

```rust
#[cfg(test)]
mod domain_tests {
    use super::super::domain::ports::*;
    use std::sync::Arc;

    // Mock implementation - NO platform dependencies
    struct MockWindowManager {
        remembered: std::sync::Mutex<bool>,
    }

    impl WindowManager for MockWindowManager {
        fn remember_current_window(&self) -> Result<(), String> {
            *self.remembered.lock().unwrap() = true;
            Ok(())
        }

        fn restore_previous_window(&self) -> Result<(), String> {
            if *self.remembered.lock().unwrap() {
                Ok(())
            } else {
                Err("No window remembered".to_string())
            }
        }

        fn clear_saved_window(&self) {
            *self.remembered.lock().unwrap() = false;
        }
    }

    #[tokio::test]
    async fn test_paste_prompt_use_case() {
        let window_manager = Arc::new(MockWindowManager::new());
        window_manager.remember_current_window().unwrap();

        let use_case = PastePromptUseCase::new(
            clipboard,
            window_manager,
            input_simulator,
        );

        let result = use_case.execute("test", true).await;
        assert!(result.is_ok());
    }
}
```

**Analysis**:
- ✅ Mock implements trait
- ✅ Use case works with mock
- ✅ No Windows APIs needed for testing
- ✅ Fast, reliable tests
- ✅ Can run on any platform

---

## SOLID Principles Verification

### Single Responsibility Principle ✅

**WindowManager**: Only manages window focus
```rust
pub trait WindowManager {
    fn remember_current_window(&self) -> Result<(), String>;
    fn restore_previous_window(&self) -> Result<(), String>;
    fn clear_saved_window(&self);
}
```

**ClipboardService**: Only manages clipboard
```rust
pub trait ClipboardService {
    fn write_text(&self, text: &str) -> Result<(), String>;
    fn read_text(&self) -> Result<String, String>;
}
```

Each trait has ONE reason to change.

### Open/Closed Principle ✅

**Open for extension** (add new adapters):
```rust
// Add new adapter without modifying existing code
pub struct LinuxX11FocusTracker;
impl WindowManager for LinuxX11FocusTracker { ... }
```

**Closed for modification** (existing code unchanged):
- Domain traits stay the same
- Use cases stay the same
- Only add new adapter files

### Liskov Substitution Principle ✅

Any `WindowManager` implementation can be substituted:
```rust
// Works with WindowsFocusTracker
let wm: Arc<dyn WindowManager> = Arc::new(WindowsFocusTracker::new());

// Also works with MockWindowManager
let wm: Arc<dyn WindowManager> = Arc::new(MockWindowManager::new());

// Also works with future MacOSFocusTracker
let wm: Arc<dyn WindowManager> = Arc::new(MacOSFocusTracker::new());

// Use case doesn't care
let use_case = ShowWindowUseCase::new(wm);
```

### Interface Segregation Principle ✅

**Small, focused interfaces**:
- WindowManager: 3 methods (focus-related)
- ClipboardService: 2 methods (read/write)
- InputSimulator: 2 methods (paste-related)

Not one fat interface with all OS operations.

### Dependency Inversion Principle ✅

**High-level** (PastePromptUseCase):
```rust
use crate::os::domain::ports::WindowManager;  // Depends on abstraction
```

**Low-level** (WindowsFocusTracker):
```rust
use crate::os::domain::ports::WindowManager;  // Implements abstraction
```

Both depend on abstraction, not concrete implementation.

---

## Final Proof: Compile-Time Safety

### Type Safety Across Layers

```rust
// Domain defines contract
pub trait WindowManager: Send + Sync { ... }

// Infrastructure must implement contract
impl WindowManager for WindowsFocusTracker { ... }
// If method signatures don't match, compilation fails ✅

// Application uses contract
pub fn new(window_manager: Arc<dyn WindowManager>) { ... }
// Can only pass types that implement WindowManager ✅
```

### Conditional Compilation

```rust
#[cfg(target_os = "windows")]
use windows::Win32::...;

#[cfg(not(target_os = "windows"))]
impl WindowManager for WindowsFocusTracker {
    fn remember_current_window(&self) -> Result<(), String> {
        Err("Not supported on this platform".to_string())
    }
}
```

**Result**: Code compiles on all platforms, with graceful fallbacks.

---

## Conclusion

**This implementation achieves TRUE hexagonal architecture**:

1. **Pure domain layer** - Zero platform dependencies
2. **Platform-agnostic use cases** - Work with any adapter
3. **Isolated platform code** - Only in infrastructure
4. **Dependency inversion** - All layers depend on abstractions
5. **Extensibility** - Add platforms without changing core
6. **Testability** - Mock adapters for fast tests
7. **Type safety** - Compiler enforces contracts

**The architecture is not theoretical - it's implemented and functional.**

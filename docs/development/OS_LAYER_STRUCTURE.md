# OS Integration Layer - File Structure

## Complete Hexagonal Architecture Implementation

```
src-tauri/src/os/
│
├── mod.rs                          # Module exports & test declaration
│
├── domain/                         # DOMAIN LAYER (Platform-agnostic)
│   ├── mod.rs
│   └── ports/                      # Interfaces/Traits
│       ├── mod.rs                  # Port exports
│       ├── window_manager.rs       # WindowManager trait
│       ├── clipboard_service.rs    # ClipboardService trait
│       └── input_simulator.rs      # InputSimulator trait + KeyCode enum
│
├── application/                    # APPLICATION LAYER (Use Cases)
│   ├── mod.rs
│   └── use_cases/
│       ├── mod.rs                  # Use case exports
│       ├── paste_prompt.rs         # PastePromptUseCase
│       └── show_window.rs          # ShowWindowUseCase
│
├── infrastructure/                 # INFRASTRUCTURE LAYER (Adapters)
│   ├── mod.rs                      # Adapter exports
│   ├── windows_focus.rs            # WindowsFocusTracker (WindowManager impl)
│   ├── tauri_clipboard.rs          # TauriClipboardAdapter (ClipboardService impl)
│   └── windows_input.rs            # WindowsInputSimulator (InputSimulator impl)
│
└── tests.rs                        # Unit & integration tests
```

## Files Modified Outside OS Module

```
src-tauri/
├── Cargo.toml                      # Added: tokio, once_cell, windows crate
├── src/
│   ├── lib.rs                      # Added: Hotkey registration, plugins
│   └── commands/
│       └── clipboard.rs            # Implemented: 3 commands (copy_and_paste, show/hide)
```

## Layer Dependencies (Critical!)

```
┌──────────────────────────────────────────────────────────┐
│ Presentation (commands/clipboard.rs)                     │
│   ↓ depends on                                           │
│ Application (use_cases/*)                                │
│   ↓ depends on                                           │
│ Domain (ports/*)                                         │
│   ↑ implemented by                                       │
│ Infrastructure (windows_*, tauri_clipboard)              │
└──────────────────────────────────────────────────────────┘
```

**Dependency Rule**: Domain NEVER imports from Infrastructure.
Infrastructure ALWAYS implements Domain interfaces.

## Import Patterns

### Domain Layer (Zero Platform Dependencies)
```rust
// src/os/domain/ports/window_manager.rs
pub trait WindowManager: Send + Sync {
    fn remember_current_window(&self) -> Result<(), String>;
    // ... NO imports from windows crate
}
```

### Application Layer (Depends on Domain)
```rust
// src/os/application/use_cases/paste_prompt.rs
use crate::os::domain::ports::{ClipboardService, InputSimulator, WindowManager};
// ... uses traits, NOT concrete implementations
```

### Infrastructure Layer (Implements Domain)
```rust
// src/os/infrastructure/windows_focus.rs
use crate::os::domain::ports::WindowManager;
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, ...};

impl WindowManager for WindowsFocusTracker {
    // ... Windows API calls here
}
```

### Presentation Layer (Constructs & Uses)
```rust
// src/commands/clipboard.rs
use crate::os::application::use_cases::PastePromptUseCase;
use crate::os::infrastructure::{WindowsFocusTracker, ...};

// Constructs concrete adapters
let window_manager = Arc::new(WindowsFocusTracker::new());
// Passes to use case as trait objects
let use_case = PastePromptUseCase::new(..., window_manager, ...);
```

## Testing Structure

```rust
// src/os/tests.rs
#[cfg(test)]
mod domain_tests {
    // Unit tests with mocks
    struct MockWindowManager;
    impl WindowManager for MockWindowManager { ... }
}

#[cfg(all(test, target_os = "windows"))]
mod windows_integration_tests {
    // Windows-only integration tests
    use super::super::infrastructure::WindowsFocusTracker;
}
```

## Command Flow Example

User presses Ctrl+Space:
```
1. lib.rs (hotkey handler)
   ↓
2. WindowsFocusTracker::remember_current_window()
   ↓
3. window.show() + window.set_focus()
   ↓
4. window.emit("focus-search")
```

User selects prompt:
```
1. Frontend calls invoke('copy_and_paste', { text, autoPaste })
   ↓
2. commands/clipboard.rs::copy_and_paste(app, text, autoPaste)
   ↓
3. Constructs: TauriClipboardAdapter, WindowsFocusTracker, WindowsInputSimulator
   ↓
4. Creates: PastePromptUseCase
   ↓
5. Calls: use_case.execute(text, autoPaste)
   ↓
6. PastePromptUseCase orchestrates:
   - ClipboardService::write_text(text)
   - WindowManager::restore_previous_window()
   - InputSimulator::simulate_paste() (if autoPaste)
   - WindowManager::clear_saved_window()
```

## Key Architectural Decisions

1. **Static Mutex for Window Handle**
   - Global state required for cross-invocation persistence
   - Thread-safe with Mutex
   - Lazy initialization with once_cell

2. **Trait Objects with Arc**
   - Use cases receive `Arc<dyn Trait>` for flexibility
   - Enables runtime polymorphism
   - Thread-safe sharing across async boundaries

3. **Async Use Cases**
   - Paste workflow requires delays (clipboard sync, UI transitions)
   - Uses tokio::time::sleep for non-blocking delays
   - Commands are async to support use case execution

4. **Conditional Compilation**
   - Windows APIs only compiled on Windows
   - Graceful fallback/errors on other platforms
   - `#[cfg(target_os = "windows")]` for platform-specific code

5. **Error Handling**
   - All operations return `Result<(), String>`
   - Errors propagate up through layers
   - Presentation layer can show error messages to user

## File Line Counts

```
Domain Layer (Ports):
  window_manager.rs         11 lines
  clipboard_service.rs       8 lines
  input_simulator.rs        15 lines
  Total:                    34 lines

Application Layer (Use Cases):
  paste_prompt.rs           47 lines
  show_window.rs            21 lines
  Total:                    68 lines

Infrastructure Layer (Adapters):
  windows_focus.rs          68 lines
  tauri_clipboard.rs        30 lines
  windows_input.rs          95 lines
  Total:                   193 lines

Tests:
  tests.rs                 118 lines

Commands (Presentation):
  clipboard.rs              68 lines

GRAND TOTAL:              481 lines of implementation
```

## Platform Portability

To add macOS support:
1. Create `infrastructure/macos_focus.rs` implementing `WindowManager`
2. Create `infrastructure/macos_input.rs` implementing `InputSimulator`
3. Use `#[cfg(target_os = "macos")]` conditionals
4. Zero changes to domain or application layers

To add Linux support:
1. Create `infrastructure/x11_focus.rs` implementing `WindowManager`
2. Create `infrastructure/x11_input.rs` implementing `InputSimulator`
3. Use `#[cfg(target_os = "linux")]` conditionals
4. Zero changes to domain or application layers

**This is the power of hexagonal architecture.**

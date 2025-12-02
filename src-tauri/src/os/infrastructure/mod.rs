// Infrastructure layer - platform-specific adapters
pub mod windows_focus;
pub mod tauri_clipboard;
pub mod windows_input;

pub use windows_focus::WindowsFocusTracker;
pub use tauri_clipboard::TauriClipboardAdapter;
pub use windows_input::WindowsInputSimulator;

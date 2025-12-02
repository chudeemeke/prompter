use crate::os::domain::ports::ClipboardService;
use tauri_plugin_clipboard_manager::ClipboardExt;

/// Tauri implementation of ClipboardService (Adapter)
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

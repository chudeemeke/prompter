// OS integration commands - Presentation layer (thin wrapper)
use crate::os::application::use_cases::{PastePromptUseCase, ShowWindowUseCase};
use crate::os::domain::ports::WindowManager;
use crate::os::infrastructure::{TauriClipboardAdapter, WindowsFocusTracker, WindowsInputSimulator};
use std::sync::Arc;
use tauri::Manager;

/// Copy text, hide window, restore focus, optionally paste
#[tauri::command]
pub async fn copy_and_paste(
    app: tauri::AppHandle,
    text: String,
    auto_paste: bool,
) -> Result<(), String> {
    log::info!("[COMMAND] copy_and_paste called: text_len={}, auto_paste={}", text.len(), auto_paste);

    // Construct adapters (infrastructure layer)
    let clipboard = Arc::new(TauriClipboardAdapter::new(app.clone()));
    let window_manager = Arc::new(WindowsFocusTracker::new());
    let input_simulator = Arc::new(WindowsInputSimulator::new());

    // Get window reference
    let window = app
        .get_webview_window("main")
        .ok_or("Could not find main window")?;

    // Hide window before use case execution
    log::info!("[COMMAND] Hiding Prompter window");
    window.hide().map_err(|e| format!("Hide error: {}", e))?;
    tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

    // Execute use case
    log::info!("[COMMAND] Executing PastePromptUseCase");
    let use_case = PastePromptUseCase::new(clipboard, window_manager, input_simulator);
    let result = use_case.execute(&text, auto_paste).await;

    match &result {
        Ok(_) => log::info!("[COMMAND] copy_and_paste completed successfully"),
        Err(e) => log::error!("[COMMAND] copy_and_paste failed: {}", e),
    }

    result
}

/// Show window and remember current focus
#[tauri::command]
pub async fn show_window(app: tauri::AppHandle) -> Result<(), String> {
    let window_manager = Arc::new(WindowsFocusTracker::new());

    // Use ShowWindowUseCase to remember current window
    let use_case = ShowWindowUseCase::new(window_manager);
    use_case.execute()?;

    // Get window reference
    let window = app
        .get_webview_window("main")
        .ok_or("Could not find main window")?;

    // Show and focus window
    window.show().map_err(|e| format!("Show error: {}", e))?;
    window.set_focus().map_err(|e| format!("Focus error: {}", e))?;

    Ok(())
}

/// Just hide window and restore focus (for Escape key)
#[tauri::command]
pub async fn hide_window(app: tauri::AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or("Could not find main window")?;

    window.hide().map_err(|e| format!("Hide error: {}", e))?;
    tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

    let window_manager = WindowsFocusTracker::new();
    window_manager.restore_previous_window()?;
    window_manager.clear_saved_window();

    Ok(())
}

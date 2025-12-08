// OS integration commands - Presentation layer (thin wrapper)
use crate::os::application::use_cases::{PastePromptUseCase, ShowWindowUseCase};
use crate::os::domain::ports::WindowManager;
use crate::os::domain::CopyPasteResult;
use crate::os::infrastructure::{TauriClipboardAdapter, WindowsFocusTracker, WindowsInputSimulator};
use std::sync::Arc;
use tauri::{Emitter, Manager};

/// Copy text, hide window, restore focus, optionally paste
/// Returns detailed result about what succeeded/failed
#[tauri::command(rename_all = "snake_case")]
pub async fn copy_and_paste(
    app: tauri::AppHandle,
    text: String,
    auto_paste: bool,
) -> Result<CopyPasteResult, String> {
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
        Ok(r) => log::info!("[COMMAND] copy_and_paste completed: {}", r.message),
        Err(e) => log::error!("[COMMAND] copy_and_paste failed: {}", e),
    }

    result
}

/// Show window and remember current focus
#[tauri::command(rename_all = "snake_case")]
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
#[tauri::command(rename_all = "snake_case")]
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

// =============================================================================
// MULTI-WINDOW COMMANDS
// =============================================================================

/// Open the editor window for creating or editing a prompt
#[tauri::command(rename_all = "snake_case")]
pub async fn open_editor_window(
    app: tauri::AppHandle,
    prompt_id: Option<String>,
    mode: Option<String>,
) -> Result<(), String> {
    log::info!("[COMMAND] open_editor_window: prompt_id={:?}, mode={:?}", prompt_id, mode);

    // Build URL with query parameters
    let mut url = "/editor".to_string();
    let mut params: Vec<String> = Vec::new();

    if let Some(id) = prompt_id {
        params.push(format!("promptId={}", id));
    }
    if let Some(m) = mode {
        params.push(format!("mode={}", m));
    }
    if !params.is_empty() {
        url = format!("{}?{}", url, params.join("&"));
    }

    // Try to get existing editor window
    if let Some(window) = app.get_webview_window("editor") {
        // Update URL and show existing window
        window.navigate(url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
            .map_err(|e| format!("Navigate error: {}", e))?;
        // Emit event for React to re-parse URL params (fixes stale memoization)
        window.emit("url-changed", ())
            .map_err(|e| format!("Emit error: {}", e))?;
        window.show().map_err(|e| format!("Show error: {}", e))?;
        window.set_focus().map_err(|e| format!("Focus error: {}", e))?;
    } else {
        // Create new window (no HWND registration needed - process-based detection)
        tauri::WebviewWindowBuilder::new(
            &app,
            "editor",
            tauri::WebviewUrl::App(url.into())
        )
        .title("Prompt Editor")
        .inner_size(900.0, 700.0)
        .min_inner_size(600.0, 400.0)
        .resizable(true)
        .center()
        .build()
        .map_err(|e| format!("Failed to create editor window: {}", e))?;
    }

    Ok(())
}

/// Open the settings window
#[tauri::command(rename_all = "snake_case")]
pub async fn open_settings_window(app: tauri::AppHandle) -> Result<(), String> {
    log::info!("[COMMAND] open_settings_window");

    // Try to get existing settings window
    if let Some(window) = app.get_webview_window("settings") {
        window.show().map_err(|e| format!("Show error: {}", e))?;
        window.set_focus().map_err(|e| format!("Focus error: {}", e))?;
    } else {
        // Create new window (no HWND registration needed - process-based detection)
        tauri::WebviewWindowBuilder::new(
            &app,
            "settings",
            tauri::WebviewUrl::App("/settings".into())
        )
        .title("Prompter Settings")
        .inner_size(600.0, 500.0)
        .min_inner_size(400.0, 300.0)
        .resizable(true)
        .center()
        .build()
        .map_err(|e| format!("Failed to create settings window: {}", e))?;
    }

    Ok(())
}

/// Open the analytics window
#[tauri::command(rename_all = "snake_case")]
pub async fn open_analytics_window(app: tauri::AppHandle) -> Result<(), String> {
    log::info!("[COMMAND] open_analytics_window");

    // Try to get existing analytics window
    if let Some(window) = app.get_webview_window("analytics") {
        window.show().map_err(|e| format!("Show error: {}", e))?;
        window.set_focus().map_err(|e| format!("Focus error: {}", e))?;
    } else {
        // Create new window (no HWND registration needed - process-based detection)
        tauri::WebviewWindowBuilder::new(
            &app,
            "analytics",
            tauri::WebviewUrl::App("/analytics".into())
        )
        .title("Prompter Analytics")
        .inner_size(800.0, 600.0)
        .min_inner_size(600.0, 400.0)
        .resizable(true)
        .center()
        .build()
        .map_err(|e| format!("Failed to create analytics window: {}", e))?;
    }

    Ok(())
}

/// Close a specific window by label
#[tauri::command(rename_all = "snake_case")]
pub async fn close_window(app: tauri::AppHandle, label: String) -> Result<(), String> {
    log::info!("[COMMAND] close_window: label={}", label);

    if let Some(window) = app.get_webview_window(&label) {
        window.close().map_err(|e| format!("Close error: {}", e))?;
    }

    Ok(())
}

// =============================================================================
// AUTOSTART COMMANDS
// =============================================================================

/// Enable auto-start on system login
#[tauri::command(rename_all = "snake_case")]
pub async fn enable_autostart(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;

    log::info!("[COMMAND] enable_autostart");

    app.autolaunch()
        .enable()
        .map_err(|e| format!("Failed to enable autostart: {}", e))
}

/// Disable auto-start on system login
#[tauri::command(rename_all = "snake_case")]
pub async fn disable_autostart(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;

    log::info!("[COMMAND] disable_autostart");

    app.autolaunch()
        .disable()
        .map_err(|e| format!("Failed to disable autostart: {}", e))
}

/// Check if auto-start is enabled
#[tauri::command(rename_all = "snake_case")]
pub async fn is_autostart_enabled(app: tauri::AppHandle) -> Result<bool, String> {
    use tauri_plugin_autostart::ManagerExt;

    log::info!("[COMMAND] is_autostart_enabled");

    app.autolaunch()
        .is_enabled()
        .map_err(|e| format!("Failed to check autostart status: {}", e))
}

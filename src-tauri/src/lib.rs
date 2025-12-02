// Module declarations
mod commands;
mod storage;
mod os;

use tauri::{Emitter, Manager};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
use os::infrastructure::WindowsFocusTracker;
use os::domain::ports::WindowManager;
use std::sync::Arc;

/// Hotkey configurations to try (in order of preference)
fn get_hotkey_candidates() -> Vec<(Shortcut, &'static str)> {
    vec![
        // Primary: F9 (function keys rarely used)
        (
            Shortcut::new(None, Code::F9),
            "F9"
        ),
        // Fallback 1: F11 (fullscreen key, but might be available)
        (
            Shortcut::new(None, Code::F11),
            "F11"
        ),
        // Fallback 2: F12 (dev tools, but might be available)
        (
            Shortcut::new(None, Code::F12),
            "F12"
        ),
        // Fallback 3: Ctrl+Shift+Space
        (
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space),
            "Ctrl+Shift+Space"
        ),
        // Fallback 4: Ctrl+Alt+Space
        (
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::Space),
            "Ctrl+Alt+Space"
        ),
        // Fallback 5: F10
        (
            Shortcut::new(None, Code::F10),
            "F10"
        ),
        // Fallback 6: Ctrl+Shift+K
        (
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyK),
            "Ctrl+Shift+K"
        ),
        // Fallback 7: Ctrl+Shift+;
        (
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Semicolon),
            "Ctrl+Shift+;"
        ),
        // Fallback 8: Alt+P
        (
            Shortcut::new(Some(Modifiers::ALT), Code::KeyP),
            "Alt+P"
        ),
        // Fallback 9: Ctrl+`
        (
            Shortcut::new(Some(Modifiers::CONTROL), Code::Backquote),
            "Ctrl+`"
        ),
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_clipboard_manager::init())
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .invoke_handler(tauri::generate_handler![
      commands::prompts::get_all_prompts,
      commands::prompts::get_prompt,
      commands::prompts::search_prompts,
      commands::prompts::save_prompt,
      commands::prompts::record_usage,
      commands::clipboard::copy_and_paste,
      commands::clipboard::show_window,
      commands::clipboard::hide_window,
      commands::clipboard::debug_log,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Create system tray icon with menu
      let show_item = MenuItem::with_id(app, "show", "Show Prompter", true, None::<&str>)?;
      let settings_item = MenuItem::with_id(app, "settings", "Settings...", true, None::<&str>)?;
      let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
      let menu = Menu::with_items(app, &[&show_item, &settings_item, &quit_item])?;

      let app_handle = app.handle().clone();
      let wm_for_tray = Arc::new(WindowsFocusTracker::new());
      let wm_clone = wm_for_tray.clone();

      let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(move |app, event| {
          match event.id().as_ref() {
            "show" => {
              // Remember current window BEFORE showing Prompter
              let _ = wm_for_tray.remember_current_window();
              if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.center();
              }
            },
            "settings" => {
              // TODO: Open settings window
              log::info!("Settings clicked - to be implemented");
            },
            "quit" => {
              app.exit(0);
            },
            _ => {}
          }
        })
        .on_tray_icon_event(move |_tray, event| {
          // Left-click to show window
          use tauri::tray::TrayIconEvent;
          if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
            // Remember current window BEFORE showing Prompter
            let _ = wm_clone.remember_current_window();
            if let Some(window) = app_handle.get_webview_window("main") {
              let _ = window.show();
              let _ = window.set_focus();
              let _ = window.center();
            }
          }
        })
        .build(app)?;

      // Try to register global hotkeys with fallback
      let candidates = get_hotkey_candidates();
      let app_handle = app.handle().clone();
      let window_manager = Arc::new(WindowsFocusTracker::new());

      let mut registered_shortcut: Option<(&'static str, Shortcut)> = None;

      for (shortcut, name) in &candidates {
        // Unregister first in case it's registered from a previous crash
        let _ = app.global_shortcut().unregister(*shortcut);

        // Set up handler (does not actually register yet)
        let handle_clone = app_handle.clone();
        let wm_clone = window_manager.clone();

        if let Err(e) = app.global_shortcut().on_shortcut(*shortcut, move |_app, _shortcut, _event| {
          if let Some(window) = handle_clone.get_webview_window("main") {
            // Remember current window before showing Prompter
            let _ = wm_clone.remember_current_window();

            // Show and focus window
            let _ = window.show();
            let _ = window.set_focus();

            // Emit event to frontend to focus search input
            let _ = window.emit("focus-search", ());
          }
        }) {
          log::warn!("Failed to set up handler for {}: {}", name, e);
          continue;
        }

        // Try to register the shortcut
        match app.global_shortcut().register(*shortcut) {
          Ok(_) => {
            log::info!("Successfully registered global hotkey: {}", name);
            registered_shortcut = Some((*name, *shortcut));
            break;
          }
          Err(e) => {
            log::warn!("Failed to register {}: {}. Trying next fallback...", name, e);
          }
        }
      }

      if registered_shortcut.is_none() {
        log::error!("Failed to register any global hotkey. The app will still work but no hotkey will trigger the window.");
      }

      // TEMPORARY: Show window on startup for testing (remove after hotkey fixed)
      // NOTE: Do NOT remember window on startup - it would remember the CMD window!
      // Users should close this window and use the tray icon to reopen it.
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.center();
        log::info!("Window shown on startup for testing");
        log::warn!("IMPORTANT: Close this window and reopen via tray icon to enable paste functionality");
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

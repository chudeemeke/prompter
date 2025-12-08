// Module declarations
mod commands;
mod storage;
mod os;

use tauri::{Emitter, Manager, RunEvent, WindowEvent};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
use os::infrastructure::WindowsFocusTracker;
use os::domain::ports::WindowManager;
use std::sync::Arc;

/// The ONE hotkey for Prompter - F9
/// Professional apps use a single, memorable hotkey rather than fallback chains
const PROMPTER_HOTKEY: Code = Code::F9;
const PROMPTER_HOTKEY_NAME: &str = "F9";

/// Legacy hotkeys that may have been registered by previous versions
/// We unregister ALL of these on startup to ensure clean state
fn get_legacy_hotkeys() -> Vec<Shortcut> {
    vec![
        Shortcut::new(None, Code::F9),
        Shortcut::new(None, Code::F10),
        Shortcut::new(None, Code::F11),
        Shortcut::new(None, Code::F12),
        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space),
        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::Space),
        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyK),
        Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Semicolon),
        Shortcut::new(Some(Modifiers::ALT), Code::KeyP),
        Shortcut::new(Some(Modifiers::CONTROL), Code::Backquote),
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    // Single instance - prevent multiple tray icons
    .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
      log::info!("[SingleInstance] Second instance detected, focusing existing window");
      // Focus the main window if it exists
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
      }
    }))
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_clipboard_manager::init())
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .plugin(tauri_plugin_autostart::init(
      tauri_plugin_autostart::MacosLauncher::LaunchAgent,
      Some(vec!["--hidden"]),
    ))
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .invoke_handler(tauri::generate_handler![
      // Prompt CRUD commands
      commands::prompts::get_all_prompts,
      commands::prompts::get_prompt,
      commands::prompts::create_prompt,
      commands::prompts::update_prompt,
      commands::prompts::delete_prompt,
      commands::prompts::duplicate_prompt,
      // Search and filtering
      commands::prompts::search_prompts,
      commands::prompts::get_prompts_by_folder,
      commands::prompts::get_prompts_by_tag,
      commands::prompts::get_favorite_prompts,
      // Organization
      commands::prompts::get_folders,
      commands::prompts::get_tags,
      commands::prompts::toggle_favorite,
      commands::prompts::create_folder,
      commands::prompts::delete_folder,
      // Version history
      commands::prompts::get_version_history,
      commands::prompts::restore_version,
      // Usage tracking
      commands::prompts::save_prompt,
      commands::prompts::record_usage,
      commands::prompts::get_usage_stats,
      // Configuration
      commands::prompts::get_config,
      commands::prompts::update_config,
      // Import/Export
      commands::prompts::export_prompt,
      commands::prompts::import_prompt,
      // Clipboard and window management
      commands::clipboard::copy_and_paste,
      commands::clipboard::show_window,
      commands::clipboard::hide_window,
      // Multi-window management
      commands::clipboard::open_editor_window,
      commands::clipboard::open_settings_window,
      commands::clipboard::open_analytics_window,
      commands::clipboard::close_window,
      // Autostart
      commands::clipboard::enable_autostart,
      commands::clipboard::disable_autostart,
      commands::clipboard::is_autostart_enabled,
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
      let new_prompt_item = MenuItem::with_id(app, "new_prompt", "New Prompt...", true, None::<&str>)?;
      let settings_item = MenuItem::with_id(app, "settings", "Settings...", true, None::<&str>)?;
      let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
      let menu = Menu::with_items(app, &[&show_item, &new_prompt_item, &settings_item, &quit_item])?;

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
            "new_prompt" => {
              log::info!("New Prompt clicked - opening editor window");
              // Open editor window in create mode
              if let Some(window) = app.get_webview_window("editor") {
                let _ = window.show();
                let _ = window.set_focus();
              } else {
                // Create new editor window (no HWND registration needed - process-based detection)
                let _ = tauri::WebviewWindowBuilder::new(
                  app,
                  "editor",
                  tauri::WebviewUrl::App("/editor".into())
                )
                .title("Prompt Editor")
                .inner_size(900.0, 700.0)
                .min_inner_size(600.0, 400.0)
                .resizable(true)
                .center()
                .build();
              }
            },
            "settings" => {
              log::info!("Settings clicked - opening settings window");
              // Open settings window
              if let Some(window) = app.get_webview_window("settings") {
                let _ = window.show();
                let _ = window.set_focus();
              } else {
                // Create new settings window (no HWND registration needed - process-based detection)
                let _ = tauri::WebviewWindowBuilder::new(
                  app,
                  "settings",
                  tauri::WebviewUrl::App("/settings".into())
                )
                .title("Prompter Settings")
                .inner_size(600.0, 500.0)
                .min_inner_size(400.0, 300.0)
                .resizable(true)
                .center()
                .build();
              }
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

      // CLEANUP: Unregister ALL legacy hotkeys from previous versions
      // This ensures a clean slate and prevents hotkey conflicts
      log::info!("Cleaning up legacy hotkeys...");
      for legacy_shortcut in get_legacy_hotkeys() {
        let _ = app.global_shortcut().unregister(legacy_shortcut);
      }
      log::info!("Legacy hotkey cleanup complete");

      // Register the ONE hotkey: F9
      let app_handle = app.handle().clone();
      let window_manager = Arc::new(WindowsFocusTracker::new());
      let shortcut = Shortcut::new(None, PROMPTER_HOTKEY);

      // Set up the hotkey handler
      let handle_clone = app_handle.clone();
      let wm_clone = window_manager.clone();

      if let Err(e) = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, _event| {
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
        log::error!("Failed to set up hotkey handler for {}: {}", PROMPTER_HOTKEY_NAME, e);
      }

      // Register the hotkey
      match app.global_shortcut().register(shortcut) {
        Ok(_) => {
          log::info!("Successfully registered global hotkey: {}", PROMPTER_HOTKEY_NAME);
        }
        Err(e) => {
          log::error!("Failed to register hotkey {}: {}. Use the system tray icon instead.", PROMPTER_HOTKEY_NAME, e);
        }
      }

      // App starts minimized to tray. Use hotkey or tray icon to show.
      // Note: No HWND registration needed - we use process-based detection to distinguish
      // internal (Prompter-to-Prompter) vs external (Prompter-to-other-app) focus changes.
      log::info!("Prompter started - use hotkey or tray icon to show window");

      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|app_handle, event| {
      match event {
        // Clean up hotkey on app exit
        RunEvent::ExitRequested { .. } | RunEvent::Exit => {
          log::info!("App exiting - unregistering hotkey...");
          let shortcut = Shortcut::new(None, PROMPTER_HOTKEY);
          if let Err(e) = app_handle.global_shortcut().unregister(shortcut) {
            log::warn!("Failed to unregister hotkey on exit: {}", e);
          } else {
            log::info!("Hotkey {} unregistered successfully", PROMPTER_HOTKEY_NAME);
          }
        }
        // Handle window events to track focus changes
        RunEvent::WindowEvent { label, event: window_event, .. } => {
          // Track blur events from ANY Prompter window (main, editor, settings)
          // Only update saved HWND if focus goes to an EXTERNAL app (not another Prompter window)
          if let WindowEvent::Focused(false) = window_event {
            let window_label = label.clone();
            // Small delay to let Windows update the foreground window
            std::thread::spawn(move || {
              std::thread::sleep(std::time::Duration::from_millis(50));
              let wm = WindowsFocusTracker::new();
              match wm.remember_if_external() {
                Ok(true) => {
                  log::info!("Updated saved window on {} blur (external focus change)", window_label);
                }
                Ok(false) => {
                  log::info!("Ignored focus change from {} (internal Prompter window switch)", window_label);
                }
                Err(e) => {
                  log::warn!("Failed to check external focus on {} blur: {}", window_label, e);
                }
              }
            });
          }
        }
        _ => {}
      }
    });
}

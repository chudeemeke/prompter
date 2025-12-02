use crate::os::domain::ports::WindowManager;
#[cfg(target_os = "windows")]
use once_cell::sync::Lazy;
#[cfg(target_os = "windows")]
use std::sync::Mutex;

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, SetForegroundWindow};

#[cfg(target_os = "windows")]
static PREVIOUS_WINDOW: Lazy<Mutex<Option<isize>>> = Lazy::new(|| Mutex::new(None));

/// Windows implementation of WindowManager (Adapter)
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
                let hwnd_val = hwnd.0 as isize;
                *PREVIOUS_WINDOW.lock().unwrap() = Some(hwnd_val);
                log::info!("WindowsFocusTracker: Remembered window handle: 0x{:X}", hwnd_val);
                Ok(())
            } else {
                log::error!("WindowsFocusTracker: Could not get foreground window");
                Err("Could not get foreground window".to_string())
            }
        }
    }

    fn restore_previous_window(&self) -> Result<(), String> {
        let handle = PREVIOUS_WINDOW.lock().unwrap();
        if let Some(hwnd_val) = *handle {
            log::info!("WindowsFocusTracker: Attempting to restore window handle: 0x{:X}", hwnd_val);
            unsafe {
                let hwnd = HWND(hwnd_val as *mut _);
                let result = SetForegroundWindow(hwnd);
                if result.as_bool() {
                    log::info!("WindowsFocusTracker: Successfully restored window focus");
                    Ok(())
                } else {
                    log::error!("WindowsFocusTracker: SetForegroundWindow failed");
                    Err("Failed to restore previous window".to_string())
                }
            }
        } else {
            log::error!("WindowsFocusTracker: No previous window saved");
            Err("No previous window saved".to_string())
        }
    }

    fn clear_saved_window(&self) {
        *PREVIOUS_WINDOW.lock().unwrap() = None;
        log::info!("WindowsFocusTracker: Cleared saved window");
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

use crate::os::domain::ports::WindowManager;
#[cfg(target_os = "windows")]
use once_cell::sync::Lazy;
#[cfg(target_os = "windows")]
use std::sync::Mutex;

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::{GetLastError, HWND};
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, IsWindow, SetForegroundWindow};

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

                // Validate HWND before attempting to use it
                if !IsWindow(hwnd).as_bool() {
                    log::error!("WindowsFocusTracker: Invalid window handle (window may have been closed)");
                    return Err(format!("Invalid window handle: 0x{:X}", hwnd_val));
                }
                log::info!("WindowsFocusTracker: HWND validated successfully");

                // Attempt to set foreground window
                let result = SetForegroundWindow(hwnd);
                if !result.as_bool() {
                    let error = GetLastError();
                    log::error!("WindowsFocusTracker: SetForegroundWindow failed with error: {:?}", error);
                    return Err(format!("SetForegroundWindow failed: {:?}", error));
                }
                log::info!("WindowsFocusTracker: SetForegroundWindow returned success");

                // Verify focus actually changed (retry up to 5 times with 20ms delays)
                for attempt in 0..5 {
                    std::thread::sleep(std::time::Duration::from_millis(20));
                    let current = GetForegroundWindow();
                    if current == hwnd {
                        log::info!("WindowsFocusTracker: Focus verified after {} attempt(s)", attempt + 1);
                        return Ok(());
                    }
                    log::warn!("WindowsFocusTracker: Focus not yet verified, attempt {}/5", attempt + 1);
                }

                // Focus verification failed after all retries
                log::error!("WindowsFocusTracker: Focus verification failed after 5 attempts");
                Err("Focus verification failed - window didn't gain focus".to_string())
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

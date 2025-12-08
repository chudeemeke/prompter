use crate::os::domain::ports::WindowManager;
#[cfg(target_os = "windows")]
use once_cell::sync::Lazy;
#[cfg(target_os = "windows")]
use std::sync::Mutex;

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::{GetLastError, HWND};
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, IsWindow, SetForegroundWindow, GetWindowThreadProcessId};

#[cfg(target_os = "windows")]
static PREVIOUS_WINDOW: Lazy<Mutex<Option<isize>>> = Lazy::new(|| Mutex::new(None));

/// Windows implementation of WindowManager (Adapter)
///
/// Uses process-based detection to distinguish internal vs external focus changes.
/// This is more robust than tracking individual window HWNDs because:
/// - No need to manually register each window
/// - Automatically covers all Prompter windows (main, editor, settings, analytics)
/// - No risk of missing dynamically created windows
pub struct WindowsFocusTracker;

impl WindowsFocusTracker {
    pub fn new() -> Self {
        Self
    }

    /// Get the process ID that owns a given window handle
    #[cfg(target_os = "windows")]
    fn get_window_process_id(hwnd: HWND) -> u32 {
        let mut process_id: u32 = 0;
        unsafe {
            GetWindowThreadProcessId(hwnd, Some(&mut process_id));
        }
        process_id
    }

    /// Check if a window belongs to the current process (i.e., is a Prompter window)
    #[cfg(target_os = "windows")]
    pub fn is_same_process(hwnd: HWND) -> bool {
        let window_pid = Self::get_window_process_id(hwnd);
        let our_pid = std::process::id();
        window_pid == our_pid
    }

    /// Remember the current foreground window ONLY if it's an external app (not a Prompter window)
    /// This is called when any Prompter window loses focus to track the last external app.
    ///
    /// Returns:
    /// - Ok(true) if an external window was saved
    /// - Ok(false) if the new foreground is another Prompter window (internal switch)
    /// - Err if we couldn't get the foreground window
    #[cfg(target_os = "windows")]
    pub fn remember_if_external(&self) -> Result<bool, String> {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.is_invalid() {
                log::warn!("WindowsFocusTracker: Could not get foreground window for external check");
                return Err("Could not get foreground window".to_string());
            }

            let hwnd_val = hwnd.0 as isize;

            // Check if the new foreground window belongs to the same process (Prompter)
            if Self::is_same_process(hwnd) {
                log::info!(
                    "WindowsFocusTracker: New foreground 0x{:X} is a Prompter window (same process), NOT updating saved HWND",
                    hwnd_val
                );
                return Ok(false); // Did not update - internal focus change
            }

            // It's an external window (different process), save it
            *PREVIOUS_WINDOW.lock().unwrap() = Some(hwnd_val);
            log::info!(
                "WindowsFocusTracker: Remembered external window handle: 0x{:X} (PID: {})",
                hwnd_val,
                Self::get_window_process_id(hwnd)
            );
            Ok(true) // Updated - external focus change
        }
    }

    // Non-Windows stubs
    #[cfg(not(target_os = "windows"))]
    pub fn remember_if_external(&self) -> Result<bool, String> {
        Err("WindowsFocusTracker is only supported on Windows".to_string())
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

                // Verify focus actually changed (retry up to 3 times with 10ms delays)
                // Reduced from 5x20ms (100ms) to 3x10ms (30ms) to match PromptLight timing
                for attempt in 0..3 {
                    std::thread::sleep(std::time::Duration::from_millis(10));
                    let current = GetForegroundWindow();
                    if current == hwnd {
                        log::info!("WindowsFocusTracker: Focus verified after {} attempt(s)", attempt + 1);
                        return Ok(());
                    }
                    log::warn!("WindowsFocusTracker: Focus not yet verified, attempt {}/3", attempt + 1);
                }

                // Focus verification failed after all retries
                log::error!("WindowsFocusTracker: Focus verification failed after 3 attempts");
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

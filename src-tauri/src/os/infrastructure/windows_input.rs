use crate::os::domain::ports::{InputSimulator, KeyCode};

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::{LPARAM, WPARAM};
#[cfg(target_os = "windows")]
use windows::Win32::System::Threading::{AttachThreadInput, GetCurrentThreadId};
#[cfg(target_os = "windows")]
use windows::Win32::UI::Input::KeyboardAndMouse::{
    GetFocus, MapVirtualKeyW, SendInput, INPUT, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP,
    MAPVK_VK_TO_VSC, VIRTUAL_KEY, VK_CONTROL, VK_V,
};
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow, GetWindowThreadProcessId, PostMessageW, SendMessageW, WM_CHAR,
    WM_KEYDOWN, WM_KEYUP, WM_PASTE,
};

/// Windows implementation of InputSimulator (Adapter)
pub struct WindowsInputSimulator;

impl WindowsInputSimulator {
    pub fn new() -> Self {
        Self
    }

    #[cfg(target_os = "windows")]
    fn keycode_to_vk(&self, key: KeyCode) -> VIRTUAL_KEY {
        match key {
            KeyCode::Control => VK_CONTROL,
            KeyCode::V => VK_V,
        }
    }

    /// Get scan code for a virtual key
    #[cfg(target_os = "windows")]
    fn get_scan_code(&self, vk: VIRTUAL_KEY) -> u16 {
        unsafe { MapVirtualKeyW(vk.0 as u32, MAPVK_VK_TO_VSC) as u16 }
    }

    /// Try to send WM_PASTE directly to the foreground window
    #[cfg(target_os = "windows")]
    fn try_wm_paste(&self) -> Result<(), String> {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.0.is_null() {
                return Err("No foreground window".to_string());
            }

            log::info!("try_wm_paste: Sending WM_PASTE to HWND {:?}", hwnd);

            // Try both SendMessage (sync) and PostMessage (async)
            // SendMessage waits for the message to be processed
            let result = SendMessageW(hwnd, WM_PASTE, None, None);
            log::info!("try_wm_paste: SendMessageW returned {:?}", result);

            // PostMessage posts to the message queue and returns immediately
            // Some apps handle paste better this way
            let _ = PostMessageW(hwnd, WM_PASTE, None, None);
            log::info!("try_wm_paste: PostMessageW sent");

            Ok(())
        }
    }

    /// Strategy: Send WM_KEYDOWN/WM_KEYUP messages to the focused control
    /// This bypasses SendInput UIPI issues by sending messages directly
    #[cfg(target_os = "windows")]
    fn try_send_message_keys(&self) -> Result<(), String> {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.0.is_null() {
                return Err("No foreground window".to_string());
            }

            // Attach to target thread to be able to call GetFocus
            let target_thread = GetWindowThreadProcessId(hwnd, None);
            let our_thread = GetCurrentThreadId();

            let attached = if target_thread != our_thread {
                let result = AttachThreadInput(our_thread, target_thread, true);
                result.as_bool()
            } else {
                true
            };

            if !attached {
                log::warn!("try_send_message_keys: Could not attach to target thread");
                // Fall back to foreground window
            }

            // Get the focused control (may be a child edit control)
            let focus_hwnd = if attached && target_thread != our_thread {
                let focus = GetFocus();
                if !focus.0.is_null() {
                    log::info!("try_send_message_keys: Using focused control {:?}", focus);
                    focus
                } else {
                    log::info!("try_send_message_keys: No focus, using foreground window");
                    hwnd
                }
            } else {
                hwnd
            };

            log::info!("try_send_message_keys: Sending WM_KEYDOWN/WM_KEYUP to {:?}", focus_hwnd);

            // Get scan codes for building lParam
            let ctrl_scan = self.get_scan_code(VK_CONTROL) as u32;
            let v_scan = self.get_scan_code(VK_V) as u32;

            // Build lParam: bits 0-15 = repeat count (1), bits 16-23 = scan code
            let ctrl_lparam_down = LPARAM((1 | (ctrl_scan << 16)) as isize);
            let v_lparam_down = LPARAM((1 | (v_scan << 16)) as isize);
            // For key up: bit 30 = previous key state (1), bit 31 = transition state (1)
            let ctrl_lparam_up = LPARAM((1 | (ctrl_scan << 16) | (1 << 30) | (1 << 31)) as isize);
            let v_lparam_up = LPARAM((1 | (v_scan << 16) | (1 << 30) | (1 << 31)) as isize);

            // Send Ctrl down
            let _ = SendMessageW(focus_hwnd, WM_KEYDOWN, WPARAM(VK_CONTROL.0 as usize), ctrl_lparam_down);
            std::thread::sleep(std::time::Duration::from_millis(10));

            // Send V down
            let _ = SendMessageW(focus_hwnd, WM_KEYDOWN, WPARAM(VK_V.0 as usize), v_lparam_down);
            std::thread::sleep(std::time::Duration::from_millis(10));

            // Send V character (some controls need WM_CHAR)
            let _ = SendMessageW(focus_hwnd, WM_CHAR, WPARAM('v' as usize), v_lparam_down);
            std::thread::sleep(std::time::Duration::from_millis(10));

            // Send V up
            let _ = SendMessageW(focus_hwnd, WM_KEYUP, WPARAM(VK_V.0 as usize), v_lparam_up);
            std::thread::sleep(std::time::Duration::from_millis(10));

            // Send Ctrl up
            let _ = SendMessageW(focus_hwnd, WM_KEYUP, WPARAM(VK_CONTROL.0 as usize), ctrl_lparam_up);

            // Detach thread input
            if attached && target_thread != our_thread {
                let _ = AttachThreadInput(our_thread, target_thread, false);
            }

            log::info!("try_send_message_keys: WM_KEYDOWN/WM_KEYUP sequence complete");
            Ok(())
        }
    }

    /// Send a single key event using virtual key code (most compatible)
    #[cfg(target_os = "windows")]
    fn send_key_event(&self, vk: VIRTUAL_KEY, key_up: bool) -> Result<(), String> {
        unsafe {
            let scan_code = self.get_scan_code(vk);

            // Use virtual key code approach (NOT KEYEVENTF_SCANCODE)
            // Many apps ignore wVk when KEYEVENTF_SCANCODE is set
            let flags = if key_up {
                KEYEVENTF_KEYUP
            } else {
                windows::Win32::UI::Input::KeyboardAndMouse::KEYBD_EVENT_FLAGS(0)
            };

            log::info!(
                "send_key_event: VK={:?} scan={} key_up={} flags={:?}",
                vk, scan_code, key_up, flags
            );

            let input = INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: vk,
                        wScan: scan_code,  // Include scan code but don't use KEYEVENTF_SCANCODE flag
                        dwFlags: flags,
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            };

            let result = SendInput(&[input], std::mem::size_of::<INPUT>() as i32);
            if result != 1 {
                return Err(format!("SendInput failed for key {:?}", vk));
            }

            Ok(())
        }
    }

    /// Simulate Ctrl+V with individual key events and delays
    #[cfg(target_os = "windows")]
    fn simulate_ctrl_v_sequential(&self) -> Result<(), String> {
        log::info!("simulate_ctrl_v_sequential: Starting sequential Ctrl+V simulation");

        // Press Ctrl
        self.send_key_event(VK_CONTROL, false)?;
        std::thread::sleep(std::time::Duration::from_millis(20));

        // Press V
        self.send_key_event(VK_V, false)?;
        std::thread::sleep(std::time::Duration::from_millis(20));

        // Release V
        self.send_key_event(VK_V, true)?;
        std::thread::sleep(std::time::Duration::from_millis(20));

        // Release Ctrl
        self.send_key_event(VK_CONTROL, true)?;

        log::info!("simulate_ctrl_v_sequential: Sequential simulation complete");
        Ok(())
    }

    /// Simulate keyboard input with thread attachment for better reliability
    #[cfg(target_os = "windows")]
    fn simulate_with_attachment(&self) -> Result<(), String> {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.0.is_null() {
                return Err("No foreground window".to_string());
            }

            let target_thread = GetWindowThreadProcessId(hwnd, None);
            let our_thread = GetCurrentThreadId();

            log::info!(
                "simulate_with_attachment: Our thread={}, Target thread={}",
                our_thread, target_thread
            );

            // Attach our input queue to the target window's thread
            let attached = if target_thread != our_thread {
                log::info!("simulate_with_attachment: Attaching thread input queues");
                let result = AttachThreadInput(our_thread, target_thread, true);
                if !result.as_bool() {
                    log::warn!("simulate_with_attachment: AttachThreadInput failed, continuing anyway");
                    false
                } else {
                    log::info!("simulate_with_attachment: Thread attachment successful");
                    true
                }
            } else {
                log::info!("simulate_with_attachment: Same thread, no attachment needed");
                false
            };

            // Small delay after attachment
            std::thread::sleep(std::time::Duration::from_millis(50));

            // Send Ctrl+V with individual events and delays
            let result = self.simulate_ctrl_v_sequential();

            // Small delay before detachment
            std::thread::sleep(std::time::Duration::from_millis(50));

            // Detach thread input if we attached
            if attached {
                log::info!("simulate_with_attachment: Detaching thread input queues");
                let _ = AttachThreadInput(our_thread, target_thread, false);
            }

            result
        }
    }
}

#[cfg(target_os = "windows")]
impl InputSimulator for WindowsInputSimulator {
    fn simulate_paste(&self) -> Result<(), String> {
        log::info!("simulate_paste: Starting paste simulation with multiple strategies");

        let mut sendinput_success = false;
        let mut sendmessage_success = false;
        let mut wm_paste_success = false;

        // Strategy 1: Try SendInput with thread attachment
        // Best for apps that process raw input
        log::info!("simulate_paste: Strategy 1 - SendInput with thread attachment");
        match self.simulate_with_attachment() {
            Ok(()) => {
                log::info!("simulate_paste: SendInput completed");
                sendinput_success = true;
                std::thread::sleep(std::time::Duration::from_millis(50));
            }
            Err(e) => {
                log::warn!("simulate_paste: SendInput failed: {}", e);
            }
        }

        // Strategy 2: Try SendMessage WM_KEYDOWN/WM_KEYUP to focused control
        // Bypasses UIPI issues, works for many apps that ignore SendInput
        log::info!("simulate_paste: Strategy 2 - SendMessage WM_KEYDOWN/WM_KEYUP");
        match self.try_send_message_keys() {
            Ok(()) => {
                log::info!("simulate_paste: SendMessage keys completed");
                sendmessage_success = true;
                std::thread::sleep(std::time::Duration::from_millis(50));
            }
            Err(e) => {
                log::warn!("simulate_paste: SendMessage keys failed: {}", e);
            }
        }

        // Strategy 3: Try WM_PASTE message
        // Works for standard edit controls that handle WM_PASTE
        log::info!("simulate_paste: Strategy 3 - WM_PASTE message");
        match self.try_wm_paste() {
            Ok(()) => {
                log::info!("simulate_paste: WM_PASTE sent successfully");
                wm_paste_success = true;
            }
            Err(e) => {
                log::warn!("simulate_paste: WM_PASTE failed: {}", e);
            }
        }

        // Return error only if ALL strategies failed
        if !sendinput_success && !sendmessage_success && !wm_paste_success {
            log::error!("simulate_paste: All paste strategies failed");
            return Err("Paste simulation failed: all strategies failed".to_string());
        }

        log::info!(
            "simulate_paste: Complete (sendinput={}, sendmessage={}, wm_paste={})",
            sendinput_success, sendmessage_success, wm_paste_success
        );
        Ok(())
    }

    fn simulate_keys(&self, keys: &[KeyCode]) -> Result<(), String> {
        // For general key simulation, use sequential approach with scan codes
        for key in keys {
            let vk = self.keycode_to_vk(*key);
            self.send_key_event(vk, false)?;
            std::thread::sleep(std::time::Duration::from_millis(20));
        }

        for key in keys.iter().rev() {
            let vk = self.keycode_to_vk(*key);
            self.send_key_event(vk, true)?;
            std::thread::sleep(std::time::Duration::from_millis(20));
        }

        Ok(())
    }
}

#[cfg(not(target_os = "windows"))]
impl InputSimulator for WindowsInputSimulator {
    fn simulate_paste(&self) -> Result<(), String> {
        Err("WindowsInputSimulator is only supported on Windows".to_string())
    }

    fn simulate_keys(&self, _keys: &[KeyCode]) -> Result<(), String> {
        Err("WindowsInputSimulator is only supported on Windows".to_string())
    }
}

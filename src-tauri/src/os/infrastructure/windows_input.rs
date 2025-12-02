use crate::os::domain::ports::{InputSimulator, KeyCode};

#[cfg(target_os = "windows")]
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_KEYBOARD, KEYBDINPUT, KEYBD_EVENT_FLAGS, KEYEVENTF_KEYUP, VIRTUAL_KEY,
    VK_CONTROL, VK_V,
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
}

#[cfg(target_os = "windows")]
impl InputSimulator for WindowsInputSimulator {
    fn simulate_paste(&self) -> Result<(), String> {
        self.simulate_keys(&[KeyCode::Control, KeyCode::V])
    }

    fn simulate_keys(&self, keys: &[KeyCode]) -> Result<(), String> {
        // Send each key press/release pair individually with small delays
        // This is more reliable than batching all inputs together

        // Press all keys (key down events)
        for key in keys {
            let input = INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: self.keycode_to_vk(*key),
                        wScan: 0,
                        dwFlags: KEYBD_EVENT_FLAGS(0),
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            };

            let result = unsafe { SendInput(&[input], std::mem::size_of::<INPUT>() as i32) };
            if result != 1 {
                return Err(format!("SendInput failed for key down: sent {}/1 inputs", result));
            }

            // Small delay between key presses (5ms)
            std::thread::sleep(std::time::Duration::from_millis(5));
        }

        // Release all keys in reverse order (key up events)
        for key in keys.iter().rev() {
            let input = INPUT {
                r#type: INPUT_KEYBOARD,
                Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                    ki: KEYBDINPUT {
                        wVk: self.keycode_to_vk(*key),
                        wScan: 0,
                        dwFlags: KEYEVENTF_KEYUP,
                        time: 0,
                        dwExtraInfo: 0,
                    },
                },
            };

            let result = unsafe { SendInput(&[input], std::mem::size_of::<INPUT>() as i32) };
            if result != 1 {
                return Err(format!("SendInput failed for key up: sent {}/1 inputs", result));
            }

            // Small delay between key releases (5ms)
            std::thread::sleep(std::time::Duration::from_millis(5));
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

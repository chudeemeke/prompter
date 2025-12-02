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
        let mut inputs = Vec::new();

        // Press all keys (key down events)
        for key in keys {
            inputs.push(INPUT {
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
            });
        }

        // Release all keys in reverse order (key up events)
        for key in keys.iter().rev() {
            inputs.push(INPUT {
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
            });
        }

        let expected_count = inputs.len();
        let result = unsafe { SendInput(&inputs, std::mem::size_of::<INPUT>() as i32) };

        if result == expected_count as u32 {
            Ok(())
        } else {
            Err(format!(
                "SendInput failed: sent {}/{} inputs",
                result, expected_count
            ))
        }
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

/// Keyboard input simulation interface (Port)
pub trait InputSimulator: Send + Sync {
    /// Simulate Ctrl+V keystroke
    fn simulate_paste(&self) -> Result<(), String>;

    /// Simulate arbitrary key combination
    /// Part of extensible input interface - reserved for future use
    #[allow(dead_code)]
    fn simulate_keys(&self, keys: &[KeyCode]) -> Result<(), String>;
}

/// Key codes for input simulation
/// Extensible for future keyboard shortcut features
#[derive(Debug, Clone, Copy)]
#[allow(dead_code)]
pub enum KeyCode {
    Control,
    V,
}

use crate::os::domain::ports::WindowManager;
use std::sync::Arc;

/// Show window use case
/// Orchestrates: Remember current window → Show Prompter window
pub struct ShowWindowUseCase {
    window_manager: Arc<dyn WindowManager>,
}

impl ShowWindowUseCase {
    pub fn new(window_manager: Arc<dyn WindowManager>) -> Self {
        Self { window_manager }
    }

    pub fn execute(&self) -> Result<(), String> {
        // Remember the window that's currently focused
        self.window_manager.remember_current_window()?;
        Ok(())
    }
}

use crate::os::domain::ports::{ClipboardService, InputSimulator, WindowManager};
use std::sync::Arc;

/// Paste prompt use case
/// Orchestrates: Copy → Hide → Restore focus → Paste
pub struct PastePromptUseCase {
    clipboard: Arc<dyn ClipboardService>,
    window_manager: Arc<dyn WindowManager>,
    input_simulator: Arc<dyn InputSimulator>,
}

impl PastePromptUseCase {
    pub fn new(
        clipboard: Arc<dyn ClipboardService>,
        window_manager: Arc<dyn WindowManager>,
        input_simulator: Arc<dyn InputSimulator>,
    ) -> Self {
        Self {
            clipboard,
            window_manager,
            input_simulator,
        }
    }

    pub async fn execute(&self, text: &str, auto_paste: bool) -> Result<(), String> {
        log::info!("PastePromptUseCase: Starting (auto_paste={})", auto_paste);

        // Step 1: Copy text to clipboard
        log::info!("PastePromptUseCase: Copying text to clipboard ({} chars)", text.len());
        self.clipboard.write_text(text)?;
        log::info!("PastePromptUseCase: Clipboard write successful");

        // Step 2: Small delay for clipboard sync
        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

        // Step 3: Restore focus to previous window
        log::info!("PastePromptUseCase: Restoring previous window focus");
        self.window_manager.restore_previous_window()?;
        log::info!("PastePromptUseCase: Window focus restored");

        // Step 4: Optionally simulate paste
        if auto_paste {
            // Wait for target window to be ready (150ms works better for apps like Notepad++)
            log::info!("PastePromptUseCase: Waiting for target window to be ready...");
            tokio::time::sleep(tokio::time::Duration::from_millis(150)).await;

            log::info!("PastePromptUseCase: Simulating paste (Ctrl+V)");
            self.input_simulator.simulate_paste()?;
            log::info!("PastePromptUseCase: Paste simulation successful");
        } else {
            log::info!("PastePromptUseCase: Auto-paste disabled, skipping paste simulation");
        }

        // Step 5: Cleanup
        log::info!("PastePromptUseCase: Cleaning up saved window");
        self.window_manager.clear_saved_window();

        log::info!("PastePromptUseCase: Completed successfully");
        Ok(())
    }
}

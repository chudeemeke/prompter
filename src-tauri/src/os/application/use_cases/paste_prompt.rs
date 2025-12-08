use crate::os::domain::ports::{ClipboardService, InputSimulator, WindowManager};
use crate::os::domain::CopyPasteResult;
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

    pub async fn execute(&self, text: &str, auto_paste: bool) -> Result<CopyPasteResult, String> {
        log::info!("PastePromptUseCase: Starting (auto_paste={})", auto_paste);

        // Step 1: Copy text to clipboard
        log::info!("PastePromptUseCase: Copying text to clipboard ({} chars)", text.len());
        if let Err(e) = self.clipboard.write_text(text) {
            return Ok(CopyPasteResult {
                clipboard_success: false,
                paste_attempted: false,
                paste_likely_success: false,
                message: format!("Failed to copy to clipboard: {}", e),
            });
        }
        log::info!("PastePromptUseCase: Clipboard write successful");

        // Step 2: Small delay for clipboard sync (20ms matches macOS PromptLight)
        tokio::time::sleep(tokio::time::Duration::from_millis(20)).await;

        // Step 2a: Verify clipboard content
        log::info!("PastePromptUseCase: Verifying clipboard content");
        let verification = match self.clipboard.read_text() {
            Ok(v) => v,
            Err(e) => {
                log::warn!("PastePromptUseCase: Clipboard verification failed: {}", e);
                // Still continue - clipboard likely worked
                text.to_string()
            }
        };

        let clipboard_verified = verification == text;
        if !clipboard_verified {
            log::warn!("PastePromptUseCase: Clipboard content mismatch (may still work)");
        } else {
            log::info!("PastePromptUseCase: Clipboard verified successfully ({} chars)", verification.len());
        }

        // Step 3: Restore focus to previous window (in blocking context)
        log::info!("PastePromptUseCase: Restoring previous window focus");
        let window_manager = Arc::clone(&self.window_manager);
        let focus_result = tokio::task::spawn_blocking(move || {
            window_manager.restore_previous_window()
        }).await;

        let focus_restored = match focus_result {
            Ok(Ok(())) => {
                log::info!("PastePromptUseCase: Window focus restored");
                true
            }
            Ok(Err(e)) => {
                log::warn!("PastePromptUseCase: Focus restore failed: {}", e);
                false
            }
            Err(e) => {
                log::warn!("PastePromptUseCase: Focus restore task failed: {}", e);
                false
            }
        };

        // Step 4: Optionally simulate paste
        let paste_attempted = auto_paste;
        let mut paste_result_ok = false;

        if auto_paste {
            // Wait for target window to be ready
            // 100ms is needed for Electron apps (VS Code, ChatGPT desktop) which have
            // complex window hierarchies and slower focus handling than native apps.
            // macOS PromptLight uses 50ms but Windows needs more time for Electron.
            log::info!("PastePromptUseCase: Waiting for target window to be ready...");
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

            log::info!("PastePromptUseCase: Simulating paste (Ctrl+V) in blocking context");
            let input_simulator = Arc::clone(&self.input_simulator);
            let paste_result = tokio::task::spawn_blocking(move || {
                input_simulator.simulate_paste()
            }).await;

            paste_result_ok = match paste_result {
                Ok(Ok(())) => {
                    log::info!("PastePromptUseCase: Paste simulation completed");
                    true
                }
                Ok(Err(e)) => {
                    log::warn!("PastePromptUseCase: Paste simulation failed: {}", e);
                    false
                }
                Err(e) => {
                    log::warn!("PastePromptUseCase: Paste simulation task failed: {}", e);
                    false
                }
            };
        } else {
            log::info!("PastePromptUseCase: Auto-paste disabled, skipping paste simulation");
        }

        // Step 5: Cleanup
        log::info!("PastePromptUseCase: Cleaning up saved window");
        self.window_manager.clear_saved_window();

        // Build result based on what happened
        // Note: paste_result_ok means "no error was returned" but due to UIPI restrictions,
        // the paste may not have actually worked. We're honest about this uncertainty.
        let paste_likely_success = paste_attempted && paste_result_ok && focus_restored;

        let message = if !auto_paste {
            "Copied to clipboard".to_string()
        } else if paste_likely_success {
            "Copied and pasted".to_string()
        } else if paste_attempted && !focus_restored {
            "Copied to clipboard - press Ctrl+V to paste".to_string()
        } else {
            // Paste was attempted but may not have worked
            "Copied to clipboard - press Ctrl+V if not pasted".to_string()
        };

        log::info!("PastePromptUseCase: Completed - {}", message);
        Ok(CopyPasteResult {
            clipboard_success: true,
            paste_attempted,
            paste_likely_success,
            message,
        })
    }
}

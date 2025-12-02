#[cfg(test)]
mod domain_tests {
    use super::super::domain::ports::*;
    use std::sync::Arc;

    // Mock implementations for testing
    struct MockWindowManager {
        remembered: std::sync::Mutex<bool>,
    }

    impl MockWindowManager {
        fn new() -> Self {
            Self {
                remembered: std::sync::Mutex::new(false),
            }
        }
    }

    impl WindowManager for MockWindowManager {
        fn remember_current_window(&self) -> Result<(), String> {
            *self.remembered.lock().unwrap() = true;
            Ok(())
        }

        fn restore_previous_window(&self) -> Result<(), String> {
            if *self.remembered.lock().unwrap() {
                Ok(())
            } else {
                Err("No window remembered".to_string())
            }
        }

        fn clear_saved_window(&self) {
            *self.remembered.lock().unwrap() = false;
        }
    }

    struct MockClipboardService;

    impl ClipboardService for MockClipboardService {
        fn write_text(&self, _text: &str) -> Result<(), String> {
            Ok(())
        }

        fn read_text(&self) -> Result<String, String> {
            Ok("test".to_string())
        }
    }

    struct MockInputSimulator;

    impl InputSimulator for MockInputSimulator {
        fn simulate_paste(&self) -> Result<(), String> {
            Ok(())
        }

        fn simulate_keys(&self, _keys: &[KeyCode]) -> Result<(), String> {
            Ok(())
        }
    }

    #[test]
    fn test_window_manager_remember_and_restore() {
        let wm = MockWindowManager::new();
        assert!(wm.remember_current_window().is_ok());
        assert!(wm.restore_previous_window().is_ok());
    }

    #[test]
    fn test_window_manager_restore_without_remember_fails() {
        let wm = MockWindowManager::new();
        assert!(wm.restore_previous_window().is_err());
    }

    #[test]
    fn test_clipboard_write_and_read() {
        let clipboard = MockClipboardService;
        assert!(clipboard.write_text("test").is_ok());
        assert_eq!(clipboard.read_text().unwrap(), "test");
    }

    #[test]
    fn test_input_simulator_paste() {
        let simulator = MockInputSimulator;
        assert!(simulator.simulate_paste().is_ok());
    }

    #[tokio::test]
    async fn test_paste_prompt_use_case() {
        use super::super::application::use_cases::PastePromptUseCase;

        let clipboard = Arc::new(MockClipboardService);
        let window_manager = Arc::new(MockWindowManager::new());
        let input_simulator = Arc::new(MockInputSimulator);

        // Remember window first
        window_manager.remember_current_window().unwrap();

        let use_case = PastePromptUseCase::new(
            clipboard.clone(),
            window_manager.clone(),
            input_simulator.clone(),
        );

        let result = use_case.execute("test text", true).await;
        assert!(result.is_ok());
    }

    #[test]
    fn test_show_window_use_case() {
        use super::super::application::use_cases::ShowWindowUseCase;

        let window_manager = Arc::new(MockWindowManager::new());
        let use_case = ShowWindowUseCase::new(window_manager.clone());

        assert!(use_case.execute().is_ok());
    }
}

#[cfg(all(test, target_os = "windows"))]
mod windows_integration_tests {
    use super::super::infrastructure::WindowsFocusTracker;
    use super::super::domain::ports::WindowManager;

    #[test]
    fn test_windows_focus_tracker_remember() {
        let tracker = WindowsFocusTracker::new();
        // This will only work when a window is actually focused
        let result = tracker.remember_current_window();
        // Don't assert on result as it depends on actual window state
        println!("Remember result: {:?}", result);
    }
}

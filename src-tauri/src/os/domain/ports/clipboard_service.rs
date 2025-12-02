/// Clipboard operations interface (Port)
pub trait ClipboardService: Send + Sync {
    /// Write text to system clipboard
    fn write_text(&self, text: &str) -> Result<(), String>;

    /// Read text from system clipboard
    /// Part of complete clipboard interface - reserved for future use
    #[allow(dead_code)]
    fn read_text(&self) -> Result<String, String>;
}

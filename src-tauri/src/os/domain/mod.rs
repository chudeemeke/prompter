// Domain layer - contains business logic interfaces (ports)
pub mod ports;

use serde::{Deserialize, Serialize};

/// Result from copy and paste operation
/// Provides detailed feedback about what succeeded/failed
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CopyPasteResult {
    /// Whether text was successfully copied to clipboard
    pub clipboard_success: bool,
    /// Whether auto-paste was attempted
    pub paste_attempted: bool,
    /// Whether paste is likely to have succeeded (best guess)
    pub paste_likely_success: bool,
    /// User-friendly message describing what happened
    pub message: String,
}

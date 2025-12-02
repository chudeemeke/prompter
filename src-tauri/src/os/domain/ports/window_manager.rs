/// Window management interface (Port)
/// Platform-specific implementations will be in Infrastructure layer
pub trait WindowManager: Send + Sync {
    /// Remember the currently focused window
    fn remember_current_window(&self) -> Result<(), String>;

    /// Restore focus to previously remembered window
    fn restore_previous_window(&self) -> Result<(), String>;

    /// Clear saved window reference
    fn clear_saved_window(&self);
}

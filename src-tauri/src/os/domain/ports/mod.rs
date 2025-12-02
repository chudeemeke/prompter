// Domain layer ports (interfaces/traits)
pub mod window_manager;
pub mod clipboard_service;
pub mod input_simulator;

pub use window_manager::WindowManager;
pub use clipboard_service::ClipboardService;
pub use input_simulator::{InputSimulator, KeyCode};

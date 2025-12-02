// OS integration module - Hexagonal Architecture
// - domain/ports/ (WindowManager, ClipboardService, InputSimulator traits)
// - application/use_cases/ (PastePromptUseCase, ShowWindowUseCase)
// - infrastructure/ (Windows adapters)

pub mod domain;
pub mod application;
pub mod infrastructure;

#[cfg(test)]
mod tests;

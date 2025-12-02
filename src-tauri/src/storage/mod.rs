// Storage module - Hexagonal Architecture implementation
pub mod domain;
pub mod application;
pub mod infrastructure;

// Re-export types used by commands layer
pub use domain::entities::Prompt;
pub use domain::value_objects::PromptId;
pub use domain::ports::{PromptRepository, SearchResult};
pub use application::services::FrecencyCalculator;
pub use application::use_cases::{SearchPromptsUseCase, SavePromptUseCase, RecordUsageUseCase};
pub use infrastructure::persistence::FilePromptRepository;
pub use infrastructure::search::FuzzySearchService;

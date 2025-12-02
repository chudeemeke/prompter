// Domain ports (interfaces) - infrastructure layer will implement these
pub mod prompt_repository;
pub mod search_service;

pub use prompt_repository::PromptRepository;
pub use search_service::{SearchService, SearchResult, MatchRange};

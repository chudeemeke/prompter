use crate::storage::domain::entities::Prompt;
use serde::{Deserialize, Serialize};

/// Result of a search operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub prompt: Prompt,
    pub score: i64,
    pub matches: Vec<MatchRange>,
}

/// Represents a matched range in a specific field
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchRange {
    pub field: String,
    pub start: usize,
    pub end: usize,
}

/// Search service interface (Port)
/// Infrastructure layer will implement this trait
/// Abstracts search algorithm to allow swapping implementations
pub trait SearchService: Send + Sync {
    /// Search prompts using the given query
    /// Returns results sorted by relevance (highest score first)
    fn search(&self, query: &str, prompts: &[Prompt]) -> Vec<SearchResult>;
}

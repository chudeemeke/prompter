use crate::storage::domain::entities::Prompt;
use crate::storage::domain::value_objects::PromptId;

/// Repository interface (Port)
/// Infrastructure layer will implement this trait
/// Abstracts data access to allow swapping storage backends
pub trait PromptRepository: Send + Sync {
    /// Find all prompts
    fn find_all(&self) -> Result<Vec<Prompt>, String>;

    /// Find a specific prompt by ID
    fn find_by_id(&self, id: &PromptId) -> Result<Prompt, String>;

    /// Save a prompt (create or update)
    fn save(&self, prompt: &Prompt) -> Result<(), String>;

    /// Delete a prompt by ID
    /// Part of complete CRUD interface - reserved for future use
    #[allow(dead_code)]
    fn delete(&self, id: &PromptId) -> Result<(), String>;
}

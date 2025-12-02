use crate::storage::domain::entities::Prompt;
use crate::storage::domain::ports::PromptRepository;

/// Save prompt use case
/// Validates and persists prompts
pub struct SavePromptUseCase<R: PromptRepository> {
    repository: R,
}

impl<R: PromptRepository> SavePromptUseCase<R> {
    pub fn new(repository: R) -> Self {
        Self { repository }
    }

    pub fn execute(&self, prompt: &Prompt) -> Result<(), String> {
        // Validate business rules
        prompt.validate()?;

        // Delegate to repository
        self.repository.save(prompt)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::storage::domain::value_objects::PromptId;

    struct MockRepository;

    impl PromptRepository for MockRepository {
        fn find_all(&self) -> Result<Vec<Prompt>, String> {
            unimplemented!()
        }

        fn find_by_id(&self, _id: &PromptId) -> Result<Prompt, String> {
            unimplemented!()
        }

        fn save(&self, _prompt: &Prompt) -> Result<(), String> {
            Ok(())
        }

        fn delete(&self, _id: &PromptId) -> Result<(), String> {
            unimplemented!()
        }
    }

    fn create_valid_prompt() -> Prompt {
        Prompt {
            id: "test-prompt".to_string(),
            name: "Test Prompt".to_string(),
            description: "Test".to_string(),
            content: "Test content".to_string(),
            folder: "test".to_string(),
            icon: "📝".to_string(),
            color: "#000000".to_string(),
            tags: vec![],
            variables: vec![],
            auto_paste: false,
            created_at: "2025-01-01T00:00:00Z".to_string(),
            updated_at: "2025-01-01T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn test_save_valid_prompt_succeeds() {
        let repository = MockRepository;
        let use_case = SavePromptUseCase::new(repository);
        let prompt = create_valid_prompt();

        assert!(use_case.execute(&prompt).is_ok());
    }

    #[test]
    fn test_save_invalid_prompt_fails() {
        let repository = MockRepository;
        let use_case = SavePromptUseCase::new(repository);
        let mut prompt = create_valid_prompt();
        prompt.name = "".to_string();

        assert!(use_case.execute(&prompt).is_err());
    }
}

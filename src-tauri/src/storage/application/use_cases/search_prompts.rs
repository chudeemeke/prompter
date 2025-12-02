use crate::storage::domain::ports::{PromptRepository, SearchResult, SearchService};
use crate::storage::application::services::FrecencyCalculator;

/// Search prompts use case
/// Orchestrates search with frecency ranking
pub struct SearchPromptsUseCase<R: PromptRepository, S: SearchService> {
    repository: R,
    search_service: S,
    frecency: FrecencyCalculator,
}

impl<R: PromptRepository, S: SearchService> SearchPromptsUseCase<R, S> {
    pub fn new(repository: R, search_service: S, frecency: FrecencyCalculator) -> Self {
        Self {
            repository,
            search_service,
            frecency,
        }
    }

    pub fn execute(&self, query: &str) -> Result<Vec<SearchResult>, String> {
        // Get all prompts
        let mut prompts = self.repository.find_all()?;

        // If empty query, return all prompts sorted by frecency
        if query.trim().is_empty() {
            self.frecency.sort_by_frecency(&mut prompts);
            return Ok(prompts
                .into_iter()
                .map(|p| SearchResult {
                    prompt: p,
                    score: 100,
                    matches: vec![],
                })
                .collect());
        }

        // Otherwise, perform fuzzy search
        Ok(self.search_service.search(query, &prompts))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::storage::domain::entities::Prompt;
    use crate::storage::domain::ports::{MatchRange, PromptRepository, SearchService};
    use crate::storage::domain::value_objects::PromptId;

    struct MockRepository {
        prompts: Vec<Prompt>,
    }

    impl PromptRepository for MockRepository {
        fn find_all(&self) -> Result<Vec<Prompt>, String> {
            Ok(self.prompts.clone())
        }

        fn find_by_id(&self, _id: &PromptId) -> Result<Prompt, String> {
            unimplemented!()
        }

        fn save(&self, _prompt: &Prompt) -> Result<(), String> {
            unimplemented!()
        }

        fn delete(&self, _id: &PromptId) -> Result<(), String> {
            unimplemented!()
        }
    }

    struct MockSearchService;

    impl SearchService for MockSearchService {
        fn search(&self, _query: &str, prompts: &[Prompt]) -> Vec<SearchResult> {
            prompts
                .iter()
                .map(|p| SearchResult {
                    prompt: p.clone(),
                    score: 100,
                    matches: vec![],
                })
                .collect()
        }
    }

    fn create_test_prompt(id: &str, name: &str) -> Prompt {
        Prompt {
            id: id.to_string(),
            name: name.to_string(),
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
    fn test_empty_query_returns_all_prompts() {
        let repository = MockRepository {
            prompts: vec![
                create_test_prompt("1", "Prompt 1"),
                create_test_prompt("2", "Prompt 2"),
            ],
        };
        let search_service = MockSearchService;
        let frecency = FrecencyCalculator::default();
        let use_case = SearchPromptsUseCase::new(repository, search_service, frecency);

        let results = use_case.execute("").unwrap();
        assert_eq!(results.len(), 2);
    }

    #[test]
    fn test_query_uses_search_service() {
        let repository = MockRepository {
            prompts: vec![create_test_prompt("1", "Prompt 1")],
        };
        let search_service = MockSearchService;
        let frecency = FrecencyCalculator::default();
        let use_case = SearchPromptsUseCase::new(repository, search_service, frecency);

        let results = use_case.execute("test query").unwrap();
        assert_eq!(results.len(), 1);
    }
}

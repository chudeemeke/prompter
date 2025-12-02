use crate::storage::domain::entities::Prompt;
use crate::storage::domain::ports::{MatchRange, SearchResult, SearchService};
use fuzzy_matcher::skim::SkimMatcherV2;
use fuzzy_matcher::FuzzyMatcher;

/// Fuzzy search adapter (implements SearchService trait)
/// Uses SkimMatcherV2 for fuzzy matching
pub struct FuzzySearchService {
    matcher: SkimMatcherV2,
}

impl FuzzySearchService {
    pub fn new() -> Self {
        Self {
            matcher: SkimMatcherV2::default(),
        }
    }

    fn search_field(
        &self,
        query: &str,
        text: &str,
        field: &str,
        weight: i64,
    ) -> Option<(i64, MatchRange)> {
        self.matcher.fuzzy_match(text, query).map(|score| {
            let weighted_score = score * weight;
            (
                weighted_score,
                MatchRange {
                    field: field.to_string(),
                    start: 0,
                    end: query.len(),
                },
            )
        })
    }
}

impl SearchService for FuzzySearchService {
    fn search(&self, query: &str, prompts: &[Prompt]) -> Vec<SearchResult> {
        let mut results = Vec::new();

        for prompt in prompts {
            let mut best_score = 0i64;
            let mut matches = Vec::new();

            // Search name (highest weight)
            if let Some((score, match_range)) =
                self.search_field(query, &prompt.name, "name", 100)
            {
                best_score = best_score.max(score);
                matches.push(match_range);
            }

            // Search description
            if !prompt.description.is_empty() {
                if let Some((score, match_range)) =
                    self.search_field(query, &prompt.description, "description", 50)
                {
                    best_score = best_score.max(score);
                    matches.push(match_range);
                }
            }

            // Search tags
            for tag in &prompt.tags {
                if let Some((score, match_range)) = self.search_field(query, tag, "tags", 75) {
                    best_score = best_score.max(score);
                    matches.push(match_range);
                }
            }

            // Search content (lowest weight)
            if let Some((score, match_range)) =
                self.search_field(query, &prompt.content, "content", 25)
            {
                best_score = best_score.max(score);
                matches.push(match_range);
            }

            if best_score > 0 {
                results.push(SearchResult {
                    prompt: prompt.clone(),
                    score: best_score,
                    matches,
                });
            }
        }

        // Sort by score descending
        results.sort_by(|a, b| b.score.cmp(&a.score));
        results
    }
}

impl Default for FuzzySearchService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_prompt(id: &str, name: &str, description: &str, tags: Vec<&str>) -> Prompt {
        Prompt {
            id: id.to_string(),
            name: name.to_string(),
            description: description.to_string(),
            content: "Test content".to_string(),
            folder: "test".to_string(),
            icon: "📝".to_string(),
            color: "#3B82F6".to_string(),
            tags: tags.iter().map(|s| s.to_string()).collect(),
            variables: vec![],
            auto_paste: false,
            created_at: "2025-01-01T00:00:00Z".to_string(),
            updated_at: "2025-01-01T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn test_search_by_name() {
        let service = FuzzySearchService::new();
        let prompts = vec![
            create_test_prompt("1", "AI Summary", "Get AI news", vec![]),
            create_test_prompt("2", "Email Reply", "Reply to emails", vec![]),
        ];

        let results = service.search("AI", &prompts);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].prompt.name, "AI Summary");
    }

    #[test]
    fn test_search_by_description() {
        let service = FuzzySearchService::new();
        let prompts = vec![
            create_test_prompt("1", "Test 1", "AI news summary", vec![]),
            create_test_prompt("2", "Test 2", "Email template", vec![]),
        ];

        let results = service.search("email", &prompts);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].prompt.id, "2");
    }

    #[test]
    fn test_search_by_tags() {
        let service = FuzzySearchService::new();
        let prompts = vec![
            create_test_prompt("1", "Prompt 1", "Desc 1", vec!["coding", "review"]),
            create_test_prompt("2", "Prompt 2", "Desc 2", vec!["writing", "email"]),
        ];

        let results = service.search("coding", &prompts);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].prompt.id, "1");
    }

    #[test]
    fn test_search_returns_sorted_by_score() {
        let service = FuzzySearchService::new();
        let prompts = vec![
            create_test_prompt("1", "Test", "Description", vec![]),
            create_test_prompt("2", "AI Test Summary", "AI related", vec![]),
            create_test_prompt("3", "AI", "Main AI prompt", vec![]),
        ];

        let results = service.search("AI", &prompts);
        assert!(results.len() >= 2);
        // Higher scores should come first
        assert!(results[0].score >= results[1].score);
    }

    #[test]
    fn test_search_no_matches() {
        let service = FuzzySearchService::new();
        let prompts = vec![create_test_prompt("1", "Test", "Description", vec![])];

        let results = service.search("nonexistent", &prompts);
        assert_eq!(results.len(), 0);
    }

    #[test]
    fn test_fuzzy_matching() {
        let service = FuzzySearchService::new();
        let prompts = vec![create_test_prompt(
            "1",
            "Email Reply Template",
            "Professional email",
            vec![],
        )];

        // Fuzzy match should work even with typos or partial matches
        let results = service.search("emil rply", &prompts);
        assert!(results.len() > 0);
    }
}

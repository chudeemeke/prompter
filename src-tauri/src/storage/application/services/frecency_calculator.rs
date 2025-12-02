use crate::storage::domain::entities::Prompt;
use crate::storage::domain::value_objects::{FrecencyScore, PromptId};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// Application service for frecency calculations
/// Manages usage tracking and scoring
#[derive(Debug, Clone)]
pub struct FrecencyCalculator {
    usage_data: HashMap<String, UsageData>,
    storage_path: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct UsageData {
    use_count: u32,
    last_used: DateTime<Utc>,
}

impl FrecencyCalculator {
    pub fn new() -> Result<Self, String> {
        let storage_path = Self::get_storage_path()?;
        let usage_data = Self::load_from_disk(&storage_path)?;

        Ok(Self {
            usage_data,
            storage_path,
        })
    }

    fn get_storage_path() -> Result<PathBuf, String> {
        let home = dirs::home_dir().ok_or("Could not find home directory")?;
        let storage_dir = home.join(".prompter");

        // Create directory if it doesn't exist
        std::fs::create_dir_all(&storage_dir)
            .map_err(|e| format!("Failed to create storage directory: {}", e))?;

        Ok(storage_dir.join("usage.json"))
    }

    fn load_from_disk(path: &PathBuf) -> Result<HashMap<String, UsageData>, String> {
        if !path.exists() {
            return Ok(HashMap::new());
        }

        let content = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read usage file: {}", e))?;

        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse usage file: {}", e))
    }

    fn save_to_disk(&self) -> Result<(), String> {
        let content = serde_json::to_string_pretty(&self.usage_data)
            .map_err(|e| format!("Failed to serialize usage data: {}", e))?;

        std::fs::write(&self.storage_path, content)
            .map_err(|e| format!("Failed to write usage file: {}", e))
    }

    pub fn record_usage(&mut self, id: &PromptId) -> Result<(), String> {
        let entry = self
            .usage_data
            .entry(id.as_str().to_string())
            .or_insert(UsageData {
                use_count: 0,
                last_used: Utc::now(),
            });

        entry.use_count += 1;
        entry.last_used = Utc::now();

        // Persist to disk
        self.save_to_disk()
    }

    pub fn get_score(&self, id: &PromptId) -> f64 {
        self.usage_data
            .get(id.as_str())
            .map(|data| {
                let score = FrecencyScore::new(data.use_count, data.last_used);
                score.calculate()
            })
            .unwrap_or(0.0)
    }

    pub fn sort_by_frecency(&self, prompts: &mut [Prompt]) {
        prompts.sort_by(|a, b| {
            let score_a = self.get_score(&PromptId::new(&a.id));
            let score_b = self.get_score(&PromptId::new(&b.id));
            score_b
                .partial_cmp(&score_a)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
    }
}

impl Default for FrecencyCalculator {
    fn default() -> Self {
        Self::new().unwrap_or_else(|_| Self {
            usage_data: HashMap::new(),
            storage_path: PathBuf::from(".prompter/usage.json"),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Duration;

    #[test]
    fn test_new_prompt_has_zero_score() {
        let calculator = FrecencyCalculator::default();
        let id = PromptId::new("new-prompt");
        assert_eq!(calculator.get_score(&id), 0.0);
    }

    #[test]
    fn test_record_usage_increases_score() {
        let mut calculator = FrecencyCalculator::default();
        let id = PromptId::new("test-prompt");

        calculator.record_usage(&id).unwrap();
        let score = calculator.get_score(&id);
        assert!(score > 0.0);
    }

    #[test]
    fn test_multiple_uses_increase_score() {
        let mut calculator = FrecencyCalculator::default();
        let id = PromptId::new("test-prompt");

        calculator.record_usage(&id).unwrap();
        let score1 = calculator.get_score(&id);

        calculator.record_usage(&id).unwrap();
        let score2 = calculator.get_score(&id);

        assert!(score2 > score1);
    }

    #[test]
    fn test_sort_by_frecency_orders_correctly() {
        let mut calculator = FrecencyCalculator::default();

        let id1 = PromptId::new("prompt1");
        let id2 = PromptId::new("prompt2");
        let id3 = PromptId::new("prompt3");

        // Record different usage patterns
        calculator.record_usage(&id1).unwrap();
        calculator.record_usage(&id2).unwrap();
        calculator.record_usage(&id2).unwrap();
        calculator.record_usage(&id3).unwrap();
        calculator.record_usage(&id3).unwrap();
        calculator.record_usage(&id3).unwrap();

        let mut prompts = vec![
            create_test_prompt("prompt1"),
            create_test_prompt("prompt2"),
            create_test_prompt("prompt3"),
        ];

        calculator.sort_by_frecency(&mut prompts);

        // prompt3 should be first (3 uses), then prompt2 (2 uses), then prompt1 (1 use)
        assert_eq!(prompts[0].id, "prompt3");
        assert_eq!(prompts[1].id, "prompt2");
        assert_eq!(prompts[2].id, "prompt1");
    }

    fn create_test_prompt(id: &str) -> Prompt {
        Prompt {
            id: id.to_string(),
            name: format!("Prompt {}", id),
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
}

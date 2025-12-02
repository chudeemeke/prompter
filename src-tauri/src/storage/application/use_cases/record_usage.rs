use crate::storage::domain::value_objects::PromptId;
use crate::storage::application::services::FrecencyCalculator;

/// Record prompt usage use case
/// Tracks usage for frecency scoring
pub struct RecordUsageUseCase {
    frecency: FrecencyCalculator,
}

impl RecordUsageUseCase {
    pub fn new(frecency: FrecencyCalculator) -> Self {
        Self { frecency }
    }

    pub fn execute(&mut self, id: &PromptId) -> Result<(), String> {
        self.frecency.record_usage(id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_record_usage_succeeds() {
        let frecency = FrecencyCalculator::default();
        let mut use_case = RecordUsageUseCase::new(frecency);
        let id = PromptId::new("test-prompt");

        assert!(use_case.execute(&id).is_ok());
    }
}

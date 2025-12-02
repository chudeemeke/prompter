use serde::{Deserialize, Serialize};

/// Type-safe prompt ID (prevents string confusion)
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct PromptId(String);

impl PromptId {
    pub fn new(id: impl Into<String>) -> Self {
        Self(id.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl From<String> for PromptId {
    fn from(s: String) -> Self {
        Self::new(s)
    }
}

impl From<&str> for PromptId {
    fn from(s: &str) -> Self {
        Self::new(s)
    }
}

impl std::fmt::Display for PromptId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prompt_id_creation_from_string() {
        let id = PromptId::new("test-id".to_string());
        assert_eq!(id.as_str(), "test-id");
    }

    #[test]
    fn test_prompt_id_creation_from_str() {
        let id = PromptId::new("test-id");
        assert_eq!(id.as_str(), "test-id");
    }

    #[test]
    fn test_prompt_id_from_string() {
        let id: PromptId = "test-id".to_string().into();
        assert_eq!(id.as_str(), "test-id");
    }

    #[test]
    fn test_prompt_id_from_str() {
        let id: PromptId = "test-id".into();
        assert_eq!(id.as_str(), "test-id");
    }

    #[test]
    fn test_prompt_id_equality() {
        let id1 = PromptId::new("test-id");
        let id2 = PromptId::new("test-id");
        assert_eq!(id1, id2);
    }

    #[test]
    fn test_prompt_id_display() {
        let id = PromptId::new("test-id");
        assert_eq!(format!("{}", id), "test-id");
    }
}

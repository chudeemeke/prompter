use serde::{Deserialize, Serialize};

/// Prompt entity with business rules
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Prompt {
    #[serde(default)]
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub content: String,
    #[serde(default)]
    pub folder: String,
    #[serde(default = "default_icon")]
    pub icon: String,
    #[serde(default = "default_color")]
    pub color: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub variables: Vec<Variable>,
    #[serde(default)]
    pub auto_paste: bool,
    #[serde(default)]
    pub is_favorite: bool,
    #[serde(default)]
    pub created_at: String,
    #[serde(default)]
    pub updated_at: String,
}

fn default_icon() -> String {
    "file-text".to_string()
}

fn default_color() -> String {
    "#6B7280".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Variable {
    pub name: String,
    pub default: String,
    pub required: bool,
}

impl Prompt {
    /// Business rule: Validate prompt name is not empty
    pub fn validate(&self) -> Result<(), String> {
        if self.name.trim().is_empty() {
            return Err("Prompt name cannot be empty".to_string());
        }
        if self.content.trim().is_empty() {
            return Err("Prompt content cannot be empty".to_string());
        }
        Ok(())
    }

    /// Business rule: Extract folder from ID (file path)
    /// Reserved for future folder-based filtering feature
    #[allow(dead_code)]
    pub fn extract_folder(&self) -> Option<String> {
        let path = std::path::Path::new(&self.id);
        path.parent()
            .and_then(|p| p.file_name())
            .and_then(|s| s.to_str())
            .map(|s| s.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_valid_prompt() -> Prompt {
        Prompt {
            id: "test-folder/test-prompt.md".to_string(),
            name: "Test Prompt".to_string(),
            description: "Test description".to_string(),
            content: "Test content".to_string(),
            folder: "test-folder".to_string(),
            icon: "📝".to_string(),
            color: "#3B82F6".to_string(),
            tags: vec!["test".to_string()],
            variables: vec![],
            auto_paste: false,
            is_favorite: false,
            created_at: "2025-01-01T00:00:00Z".to_string(),
            updated_at: "2025-01-01T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn test_valid_prompt_passes_validation() {
        let prompt = create_valid_prompt();
        assert!(prompt.validate().is_ok());
    }

    #[test]
    fn test_empty_name_fails_validation() {
        let mut prompt = create_valid_prompt();
        prompt.name = "".to_string();
        assert!(prompt.validate().is_err());
        assert_eq!(
            prompt.validate().unwrap_err(),
            "Prompt name cannot be empty"
        );
    }

    #[test]
    fn test_whitespace_name_fails_validation() {
        let mut prompt = create_valid_prompt();
        prompt.name = "   ".to_string();
        assert!(prompt.validate().is_err());
    }

    #[test]
    fn test_empty_content_fails_validation() {
        let mut prompt = create_valid_prompt();
        prompt.content = "".to_string();
        assert!(prompt.validate().is_err());
        assert_eq!(
            prompt.validate().unwrap_err(),
            "Prompt content cannot be empty"
        );
    }

    #[test]
    fn test_extract_folder_from_path() {
        let prompt = create_valid_prompt();
        let folder = prompt.extract_folder();
        assert_eq!(folder, Some("test-folder".to_string()));
    }

    #[test]
    fn test_extract_folder_from_root_path() {
        let mut prompt = create_valid_prompt();
        prompt.id = "test-prompt.md".to_string();
        let folder = prompt.extract_folder();
        assert_eq!(folder, None);
    }
}

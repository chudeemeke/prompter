use crate::storage::domain::entities::Prompt;
use crate::storage::domain::ports::PromptRepository;
use crate::storage::domain::value_objects::PromptId;
use crate::storage::infrastructure::persistence::YamlParser;
use std::path::PathBuf;
use walkdir::WalkDir;

/// File-based repository adapter (implements PromptRepository trait)
/// Stores prompts as markdown files with YAML frontmatter
pub struct FilePromptRepository {
    prompts_dir: PathBuf,
    parser: YamlParser,
}

impl FilePromptRepository {
    pub fn new() -> Result<Self, String> {
        let prompts_dir = dirs::home_dir()
            .ok_or("Could not find home directory")?
            .join(".prompter")
            .join("prompts");

        // Create directory if it doesn't exist
        std::fs::create_dir_all(&prompts_dir)
            .map_err(|e| format!("Failed to create prompts directory: {}", e))?;

        Ok(Self {
            prompts_dir,
            parser: YamlParser::new(),
        })
    }

    /// Create a repository with a custom directory (for testing)
    #[cfg(test)]
    pub fn with_directory(prompts_dir: PathBuf) -> Result<Self, String> {
        std::fs::create_dir_all(&prompts_dir)
            .map_err(|e| format!("Failed to create prompts directory: {}", e))?;

        Ok(Self {
            prompts_dir,
            parser: YamlParser::new(),
        })
    }

    fn list_prompt_files(&self) -> Result<Vec<PathBuf>, String> {
        let mut files = Vec::new();

        for entry in WalkDir::new(&self.prompts_dir)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
                files.push(path.to_path_buf());
            }
        }

        Ok(files)
    }

    fn get_prompt_path(&self, id: &PromptId) -> PathBuf {
        self.prompts_dir.join(id.as_str())
    }
}

impl PromptRepository for FilePromptRepository {
    fn find_all(&self) -> Result<Vec<Prompt>, String> {
        let files = self.list_prompt_files()?;
        let mut prompts = Vec::new();

        for file in files {
            match self.parser.parse(&file) {
                Ok(prompt) => prompts.push(prompt),
                Err(e) => {
                    eprintln!("Warning: Failed to parse {}: {}", file.display(), e);
                }
            }
        }

        Ok(prompts)
    }

    fn find_by_id(&self, id: &PromptId) -> Result<Prompt, String> {
        let path = self.get_prompt_path(id);
        if !path.exists() {
            return Err(format!("Prompt not found: {}", id));
        }
        self.parser.parse(&path)
    }

    fn save(&self, prompt: &Prompt) -> Result<(), String> {
        let path = self.get_prompt_path(&PromptId::new(&prompt.id));

        // Create parent directory if needed
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }

        let content = self.parser.serialize(prompt)?;
        std::fs::write(&path, content)
            .map_err(|e| format!("Failed to write file: {}", e))
    }

    fn delete(&self, id: &PromptId) -> Result<(), String> {
        let path = self.get_prompt_path(id);
        if !path.exists() {
            return Err(format!("Prompt not found: {}", id));
        }
        std::fs::remove_file(&path)
            .map_err(|e| format!("Failed to delete file: {}", e))
    }
}

impl Default for FilePromptRepository {
    fn default() -> Self {
        Self::new().unwrap_or_else(|_| {
            Self {
                prompts_dir: PathBuf::from(".prompter/prompts"),
                parser: YamlParser::new(),
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn create_test_prompt(id: &str, name: &str) -> Prompt {
        Prompt {
            id: id.to_string(),
            name: name.to_string(),
            description: "Test description".to_string(),
            content: "Test content".to_string(),
            folder: "test".to_string(),
            icon: "📝".to_string(),
            color: "#3B82F6".to_string(),
            tags: vec!["test".to_string()],
            variables: vec![],
            auto_paste: false,
            created_at: "2025-01-01T00:00:00Z".to_string(),
            updated_at: "2025-01-01T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn test_save_and_load_prompt() {
        let temp_dir = TempDir::new().unwrap();
        let repo = FilePromptRepository::with_directory(temp_dir.path().to_path_buf()).unwrap();

        let prompt = create_test_prompt("test-prompt.md", "Test Prompt");
        repo.save(&prompt).unwrap();

        let loaded = repo.find_by_id(&PromptId::new("test-prompt.md")).unwrap();
        assert_eq!(loaded.name, "Test Prompt");
        assert_eq!(loaded.content, "Test content");
    }

    #[test]
    fn test_find_all_prompts() {
        let temp_dir = TempDir::new().unwrap();
        let repo = FilePromptRepository::with_directory(temp_dir.path().to_path_buf()).unwrap();

        repo.save(&create_test_prompt("prompt1.md", "Prompt 1")).unwrap();
        repo.save(&create_test_prompt("prompt2.md", "Prompt 2")).unwrap();

        let prompts = repo.find_all().unwrap();
        assert_eq!(prompts.len(), 2);
    }

    #[test]
    fn test_delete_prompt() {
        let temp_dir = TempDir::new().unwrap();
        let repo = FilePromptRepository::with_directory(temp_dir.path().to_path_buf()).unwrap();

        let prompt = create_test_prompt("test-prompt.md", "Test Prompt");
        repo.save(&prompt).unwrap();

        repo.delete(&PromptId::new("test-prompt.md")).unwrap();

        let result = repo.find_by_id(&PromptId::new("test-prompt.md"));
        assert!(result.is_err());
    }

    #[test]
    fn test_find_by_id_not_found() {
        let temp_dir = TempDir::new().unwrap();
        let repo = FilePromptRepository::with_directory(temp_dir.path().to_path_buf()).unwrap();

        let result = repo.find_by_id(&PromptId::new("nonexistent.md"));
        assert!(result.is_err());
    }

    #[test]
    fn test_delete_not_found() {
        let temp_dir = TempDir::new().unwrap();
        let repo = FilePromptRepository::with_directory(temp_dir.path().to_path_buf()).unwrap();

        let result = repo.delete(&PromptId::new("nonexistent.md"));
        assert!(result.is_err());
    }
}

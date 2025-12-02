use crate::storage::domain::entities::Prompt;
use std::path::Path;

/// YAML + Markdown parser
/// Parses markdown files with YAML frontmatter
pub struct YamlParser;

impl YamlParser {
    pub fn new() -> Self {
        Self
    }

    pub fn parse(&self, path: &Path) -> Result<Prompt, String> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        // Split on --- delimiters
        let parts: Vec<&str> = content.split("---").collect();
        if parts.len() < 3 {
            return Err("Invalid file format: missing frontmatter delimiters".to_string());
        }

        // Parse YAML frontmatter (parts[1] is between first and second ---)
        let frontmatter = parts[1].trim();
        if frontmatter.is_empty() {
            return Err("Invalid file format: empty frontmatter".to_string());
        }

        let mut prompt: Prompt = serde_yaml::from_str(frontmatter)
            .map_err(|e| format!("Failed to parse YAML frontmatter: {}", e))?;

        // Extract content (everything after second ---)
        prompt.content = parts[2..].join("---").trim().to_string();

        // Set ID from relative path
        prompt.id = path
            .file_name()
            .and_then(|s| s.to_str())
            .ok_or("Invalid file name")?
            .to_string();

        Ok(prompt)
    }

    pub fn serialize(&self, prompt: &Prompt) -> Result<String, String> {
        // Create frontmatter without content field
        let frontmatter_data = serde_yaml::to_string(&prompt)
            .map_err(|e| format!("Failed to serialize YAML: {}", e))?;

        Ok(format!("---\n{}---\n\n{}", frontmatter_data, prompt.content))
    }
}

impl Default for YamlParser {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::io::Write;
    use std::path::PathBuf;
    use tempfile::TempDir;

    fn create_test_prompt_file(dir: &TempDir, filename: &str, frontmatter: &str, content: &str) -> PathBuf {
        let path = dir.path().join(filename);
        let mut file = fs::File::create(&path).unwrap();
        writeln!(file, "---").unwrap();
        writeln!(file, "{}", frontmatter).unwrap();
        writeln!(file, "---").unwrap();
        writeln!(file, "{}", content).unwrap();
        path
    }

    #[test]
    fn test_parse_valid_prompt() {
        let temp_dir = TempDir::new().unwrap();
        let frontmatter = concat!(
            "name: \"Test Prompt\"\n",
            "description: \"A test prompt\"\n",
            "folder: \"test\"\n",
            "icon: \"T\"\n",
            "color: \"#3B82F6\"\n",
            "tags: [\"test\", \"example\"]\n",
            "variables: []\n",
            "auto_paste: false\n",
            "created_at: \"2025-01-01T00:00:00Z\"\n",
            "updated_at: \"2025-01-01T00:00:00Z\""
        );
        let content = "This is the prompt content";
        let path = create_test_prompt_file(&temp_dir, "test.md", frontmatter, content);

        let parser = YamlParser::new();
        let prompt = parser.parse(&path).unwrap();

        assert_eq!(prompt.name, "Test Prompt");
        assert_eq!(prompt.description, "A test prompt");
        assert_eq!(prompt.content, "This is the prompt content");
        assert_eq!(prompt.tags, vec!["test", "example"]);
    }

    #[test]
    fn test_parse_missing_delimiters() {
        let temp_dir = TempDir::new().unwrap();
        let path = temp_dir.path().join("invalid.md");
        let mut file = fs::File::create(&path).unwrap();
        writeln!(file, "No frontmatter here").unwrap();

        let parser = YamlParser::new();
        let result = parser.parse(&path);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("missing frontmatter"));
    }

    #[test]
    fn test_parse_empty_frontmatter() {
        let temp_dir = TempDir::new().unwrap();
        let path = temp_dir.path().join("empty.md");
        let mut file = fs::File::create(&path).unwrap();
        writeln!(file, "---").unwrap();
        writeln!(file, "---").unwrap();
        writeln!(file, "Content").unwrap();

        let parser = YamlParser::new();
        let result = parser.parse(&path);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("empty frontmatter"));
    }

    #[test]
    fn test_serialize_prompt() {
        let parser = YamlParser::new();
        let prompt = Prompt {
            id: "test.md".to_string(),
            name: "Test".to_string(),
            description: "Test desc".to_string(),
            content: "Test content".to_string(),
            folder: "test".to_string(),
            icon: "T".to_string(),
            color: "#000000".to_string(),
            tags: vec!["test".to_string()],
            variables: vec![],
            auto_paste: false,
            created_at: "2025-01-01T00:00:00Z".to_string(),
            updated_at: "2025-01-01T00:00:00Z".to_string(),
        };

        let serialized = parser.serialize(&prompt).unwrap();

        assert!(serialized.contains("---"));
        assert!(serialized.contains("name: Test"));
        assert!(serialized.contains("Test content"));
    }
}

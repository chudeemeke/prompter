# Agent A: Data Layer (Hexagonal Architecture)

You are implementing the **Data Layer** for Prompter using **Hexagonal Architecture** with **Ports & Adapters** pattern.

## Your Mission

Build the Rust backend with clean architecture separation:
- **Domain Layer**: Pure business logic, entities, ports (interfaces)
- **Application Layer**: Use cases, orchestration
- **Infrastructure Layer**: Adapters (file storage, search implementation)

You work INDEPENDENTLY - no dependencies on other agents.

---

## Architecture Overview

```
src-tauri/src/
├── domain/
│   ├── entities/
│   │   └── prompt.rs              # Prompt entity with business rules
│   ├── value_objects/
│   │   ├── prompt_id.rs           # Type-safe ID
│   │   └── frecency_score.rs      # Encapsulated scoring logic
│   └── ports/
│       ├── prompt_repository.rs   # Repository interface (trait)
│       └── search_service.rs      # Search interface (trait)
├── application/
│   ├── use_cases/
│   │   ├── search_prompts.rs      # Search use case
│   │   ├── save_prompt.rs         # Save use case
│   │   └── record_usage.rs        # Frecency tracking use case
│   └── services/
│       └── frecency_calculator.rs # Application service
└── infrastructure/
    ├── persistence/
    │   ├── file_prompt_repository.rs  # Implements PromptRepository trait
    │   └── yaml_parser.rs             # Markdown + YAML parsing
    └── search/
        └── fuzzy_search_service.rs    # Implements SearchService trait
```

**Dependency Direction:**
```
Infrastructure → Application → Domain
```

**Critical Rule:** Domain NEVER imports from Infrastructure or Application.

---

## File Boundaries (STRICT)

You ONLY touch these files:

```
OWNS (create/modify freely):
  src-tauri/src/domain/
  ├── entities/prompt.rs
  ├── value_objects/
  │   ├── prompt_id.rs
  │   └── frecency_score.rs
  └── ports/
      ├── prompt_repository.rs
      └── search_service.rs

  src-tauri/src/application/
  ├── use_cases/
  │   ├── search_prompts.rs
  │   ├── save_prompt.rs
  │   └── record_usage.rs
  └── services/
      └── frecency_calculator.rs

  src-tauri/src/infrastructure/
  ├── persistence/
  │   ├── file_prompt_repository.rs
  │   └── yaml_parser.rs
  └── search/
      └── fuzzy_search_service.rs

  src-tauri/src/commands/
  ├── prompts.rs        # Thin wrapper calling use cases
  └── search.rs         # Thin wrapper calling use cases

READ ONLY (do not modify):
  src-tauri/src/commands/mod.rs    # Data structures defined here
  src-tauri/Cargo.toml             # Dependencies already declared
```

---

## 1. Domain Layer (Pure Business Logic)

### `domain/entities/prompt.rs`

```rust
use serde::{Deserialize, Serialize};

/// Prompt entity with business rules
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Prompt {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub content: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub folder: Option<String>,
    pub variables: Option<Vec<Variable>>,
    pub tags: Option<Vec<String>>,
    pub created: String,
    pub modified: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Variable {
    pub name: String,
    pub default: Option<String>,
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

    /// Business rule: Extract folder from ID
    pub fn extract_folder(&self) -> Option<String> {
        let path = std::path::Path::new(&self.id);
        path.parent()
            .and_then(|p| p.file_name())
            .and_then(|s| s.to_str())
            .map(|s| s.to_string())
    }
}
```

### `domain/value_objects/prompt_id.rs`

```rust
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
```

### `domain/value_objects/frecency_score.rs`

```rust
use chrono::{DateTime, Utc};

/// Encapsulated frecency scoring logic
#[derive(Debug, Clone)]
pub struct FrecencyScore {
    use_count: u32,
    last_used: DateTime<Utc>,
}

impl FrecencyScore {
    pub fn new(use_count: u32, last_used: DateTime<Utc>) -> Self {
        Self { use_count, last_used }
    }

    /// Calculate frecency score using time decay algorithm
    pub fn calculate(&self) -> f64 {
        let now = Utc::now();
        let days_since = (now - self.last_used).num_days() as f64;
        let recency_decay = 1.0 / (1.0 + days_since * 0.1);
        self.use_count as f64 * recency_decay
    }
}
```

### `domain/ports/prompt_repository.rs`

```rust
use crate::domain::entities::prompt::Prompt;
use crate::domain::value_objects::prompt_id::PromptId;

/// Repository interface (Port)
/// Infrastructure layer will implement this
pub trait PromptRepository {
    fn find_all(&self) -> Result<Vec<Prompt>, String>;
    fn find_by_id(&self, id: &PromptId) -> Result<Prompt, String>;
    fn save(&self, prompt: &Prompt) -> Result<(), String>;
    fn delete(&self, id: &PromptId) -> Result<(), String>;
}
```

### `domain/ports/search_service.rs`

```rust
use crate::domain::entities::prompt::Prompt;

#[derive(Debug, Clone)]
pub struct SearchResult {
    pub prompt: Prompt,
    pub score: i64,
    pub matches: Vec<MatchRange>,
}

#[derive(Debug, Clone)]
pub struct MatchRange {
    pub field: String,
    pub start: usize,
    pub end: usize,
}

/// Search service interface (Port)
/// Infrastructure layer will implement this
pub trait SearchService {
    fn search(&self, query: &str, prompts: &[Prompt]) -> Vec<SearchResult>;
}
```

---

## 2. Application Layer (Use Cases)

### `application/use_cases/search_prompts.rs`

```rust
use crate::domain::entities::prompt::Prompt;
use crate::domain::ports::{PromptRepository, SearchService, SearchResult};
use crate::application::services::frecency_calculator::FrecencyCalculator;

/// Search prompts use case
pub struct SearchPromptsUseCase {
    repository: Box<dyn PromptRepository>,
    search_service: Box<dyn SearchService>,
    frecency: FrecencyCalculator,
}

impl SearchPromptsUseCase {
    pub fn new(
        repository: Box<dyn PromptRepository>,
        search_service: Box<dyn SearchService>,
        frecency: FrecencyCalculator,
    ) -> Self {
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
            return Ok(prompts.into_iter().map(|p| SearchResult {
                prompt: p,
                score: 100,
                matches: vec![],
            }).collect());
        }

        // Otherwise, perform fuzzy search
        Ok(self.search_service.search(query, &prompts))
    }
}
```

### `application/use_cases/save_prompt.rs`

```rust
use crate::domain::entities::prompt::Prompt;
use crate::domain::ports::PromptRepository;

/// Save prompt use case
pub struct SavePromptUseCase {
    repository: Box<dyn PromptRepository>,
}

impl SavePromptUseCase {
    pub fn new(repository: Box<dyn PromptRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, prompt: &Prompt) -> Result<(), String> {
        // Validate business rules
        prompt.validate()?;

        // Delegate to repository
        self.repository.save(prompt)
    }
}
```

### `application/use_cases/record_usage.rs`

```rust
use crate::domain::value_objects::prompt_id::PromptId;
use crate::application::services::frecency_calculator::FrecencyCalculator;

/// Record prompt usage use case
pub struct RecordUsageUseCase {
    frecency: FrecencyCalculator,
}

impl RecordUsageUseCase {
    pub fn new(frecency: FrecencyCalculator) -> Self {
        Self { frecency }
    }

    pub fn execute(&self, id: &PromptId) -> Result<(), String> {
        self.frecency.record_usage(id)
    }
}
```

### `application/services/frecency_calculator.rs`

```rust
use crate::domain::entities::prompt::Prompt;
use crate::domain::value_objects::prompt_id::PromptId;
use crate::domain::value_objects::frecency_score::FrecencyScore;
use std::collections::HashMap;
use chrono::{DateTime, Utc};

/// Application service for frecency calculations
pub struct FrecencyCalculator {
    usage_data: HashMap<String, UsageData>,
}

#[derive(Debug, Clone)]
struct UsageData {
    use_count: u32,
    last_used: DateTime<Utc>,
}

impl FrecencyCalculator {
    pub fn new() -> Self {
        // Load from ~/.prompter/usage.json
        Self {
            usage_data: HashMap::new(),
        }
    }

    pub fn record_usage(&mut self, id: &PromptId) -> Result<(), String> {
        let entry = self.usage_data.entry(id.as_str().to_string())
            .or_insert(UsageData {
                use_count: 0,
                last_used: Utc::now(),
            });

        entry.use_count += 1;
        entry.last_used = Utc::now();

        // Persist to disk
        self.save_to_disk()?;
        Ok(())
    }

    pub fn get_score(&self, id: &PromptId) -> f64 {
        self.usage_data.get(id.as_str())
            .map(|data| {
                let score = FrecencyScore::new(data.use_count, data.last_used);
                score.calculate()
            })
            .unwrap_or(0.0)
    }

    pub fn sort_by_frecency(&self, prompts: &mut Vec<Prompt>) {
        prompts.sort_by(|a, b| {
            let score_a = self.get_score(&PromptId::new(&a.id));
            let score_b = self.get_score(&PromptId::new(&b.id));
            score_b.partial_cmp(&score_a).unwrap()
        });
    }

    fn save_to_disk(&self) -> Result<(), String> {
        // Implementation: Save to ~/.prompter/usage.json
        Ok(())
    }
}
```

---

## 3. Infrastructure Layer (Adapters)

### `infrastructure/persistence/file_prompt_repository.rs`

```rust
use crate::domain::entities::prompt::Prompt;
use crate::domain::value_objects::prompt_id::PromptId;
use crate::domain::ports::PromptRepository;
use crate::infrastructure::persistence::yaml_parser::YamlParser;
use std::path::{Path, PathBuf};

/// File-based repository adapter (implements PromptRepository trait)
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

    fn list_prompt_files(&self) -> Result<Vec<PathBuf>, String> {
        let mut files = Vec::new();
        self.walk_dir(&self.prompts_dir, &mut files)?;
        Ok(files)
    }

    fn walk_dir(&self, dir: &Path, files: &mut Vec<PathBuf>) -> Result<(), String> {
        for entry in std::fs::read_dir(dir)
            .map_err(|e| format!("Failed to read directory: {}", e))? {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let path = entry.path();

            if path.is_dir() {
                self.walk_dir(&path, files)?;
            } else if path.extension().and_then(|s| s.to_str()) == Some("md") {
                files.push(path);
            }
        }
        Ok(())
    }
}

impl PromptRepository for FilePromptRepository {
    fn find_all(&self) -> Result<Vec<Prompt>, String> {
        let files = self.list_prompt_files()?;
        let mut prompts = Vec::new();

        for file in files {
            match self.parser.parse(&file) {
                Ok(prompt) => prompts.push(prompt),
                Err(e) => eprintln!("Failed to parse {}: {}", file.display(), e),
            }
        }

        Ok(prompts)
    }

    fn find_by_id(&self, id: &PromptId) -> Result<Prompt, String> {
        let path = self.prompts_dir.join(id.as_str());
        self.parser.parse(&path)
    }

    fn save(&self, prompt: &Prompt) -> Result<(), String> {
        let path = self.prompts_dir.join(&prompt.id);

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
        let path = self.prompts_dir.join(id.as_str());
        std::fs::remove_file(&path)
            .map_err(|e| format!("Failed to delete file: {}", e))
    }
}
```

### `infrastructure/persistence/yaml_parser.rs`

```rust
use crate::domain::entities::prompt::Prompt;
use std::path::Path;

/// YAML + Markdown parser
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
            return Err("Invalid file format: missing frontmatter".to_string());
        }

        // Parse YAML frontmatter
        let frontmatter = parts[1];
        let mut prompt: Prompt = serde_yaml::from_str(frontmatter)
            .map_err(|e| format!("Failed to parse YAML: {}", e))?;

        // Extract content (everything after second ---)
        prompt.content = parts[2..].join("---").trim().to_string();

        // Set ID from path (relative to prompts directory)
        prompt.id = path.file_name()
            .and_then(|s| s.to_str())
            .ok_or("Invalid file name")?
            .to_string();

        Ok(prompt)
    }

    pub fn serialize(&self, prompt: &Prompt) -> Result<String, String> {
        let frontmatter = serde_yaml::to_string(&prompt)
            .map_err(|e| format!("Failed to serialize YAML: {}", e))?;

        Ok(format!("---\n{}---\n\n{}", frontmatter, prompt.content))
    }
}
```

### `infrastructure/search/fuzzy_search_service.rs`

```rust
use crate::domain::entities::prompt::Prompt;
use crate::domain::ports::{SearchService, SearchResult, MatchRange};
use fuzzy_matcher::FuzzyMatcher;
use fuzzy_matcher::skim::SkimMatcherV2;

/// Fuzzy search adapter (implements SearchService trait)
pub struct FuzzySearchService {
    matcher: SkimMatcherV2,
}

impl FuzzySearchService {
    pub fn new() -> Self {
        Self {
            matcher: SkimMatcherV2::default(),
        }
    }

    fn search_field(&self, query: &str, text: &str, field: &str, weight: i64) -> Option<(i64, MatchRange)> {
        self.matcher.fuzzy_match(text, query).map(|score| {
            let weighted_score = score * weight;
            (weighted_score, MatchRange {
                field: field.to_string(),
                start: 0,
                end: query.len(),
            })
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
            if let Some((score, match_range)) = self.search_field(query, &prompt.name, "name", 100) {
                best_score = best_score.max(score);
                matches.push(match_range);
            }

            // Search description
            if let Some(desc) = &prompt.description {
                if let Some((score, match_range)) = self.search_field(query, desc, "description", 50) {
                    best_score = best_score.max(score);
                    matches.push(match_range);
                }
            }

            // Search tags
            if let Some(tags) = &prompt.tags {
                for tag in tags {
                    if let Some((score, match_range)) = self.search_field(query, tag, "tags", 75) {
                        best_score = best_score.max(score);
                        matches.push(match_range);
                    }
                }
            }

            // Search content (lowest weight)
            if let Some((score, match_range)) = self.search_field(query, &prompt.content, "content", 25) {
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
```

---

## 4. Presentation Layer (Tauri Commands)

### `commands/prompts.rs`

```rust
use crate::domain::entities::prompt::Prompt;
use crate::domain::value_objects::prompt_id::PromptId;
use crate::application::use_cases::{SavePromptUseCase, RecordUsageUseCase};
use crate::infrastructure::persistence::FilePromptRepository;
use crate::application::services::FrecencyCalculator;

#[tauri::command]
pub async fn get_all_prompts() -> Result<Vec<Prompt>, String> {
    let repository = FilePromptRepository::new()?;
    repository.find_all()
}

#[tauri::command]
pub async fn get_prompt(id: String) -> Result<Prompt, String> {
    let repository = FilePromptRepository::new()?;
    repository.find_by_id(&PromptId::new(id))
}

#[tauri::command]
pub async fn save_prompt(prompt: Prompt) -> Result<(), String> {
    let repository = Box::new(FilePromptRepository::new()?);
    let use_case = SavePromptUseCase::new(repository);
    use_case.execute(&prompt)
}

#[tauri::command]
pub async fn delete_prompt(id: String) -> Result<(), String> {
    let repository = FilePromptRepository::new()?;
    repository.delete(&PromptId::new(id))
}

#[tauri::command]
pub async fn record_prompt_usage(id: String) -> Result<(), String> {
    let frecency = FrecencyCalculator::new();
    let use_case = RecordUsageUseCase::new(frecency);
    use_case.execute(&PromptId::new(id))
}
```

### `commands/search.rs`

```rust
use crate::domain::ports::SearchResult;
use crate::application::use_cases::SearchPromptsUseCase;
use crate::infrastructure::persistence::FilePromptRepository;
use crate::infrastructure::search::FuzzySearchService;
use crate::application::services::FrecencyCalculator;

#[tauri::command]
pub async fn search_prompts(query: String) -> Result<Vec<SearchResult>, String> {
    let repository = Box::new(FilePromptRepository::new()?);
    let search_service = Box::new(FuzzySearchService::new());
    let frecency = FrecencyCalculator::new();

    let use_case = SearchPromptsUseCase::new(repository, search_service, frecency);
    use_case.execute(&query)
}
```

---

## Success Criteria

```
[ ] Domain layer has NO dependencies on infrastructure
[ ] All business rules encapsulated in domain entities
[ ] Use cases orchestrate domain logic
[ ] Repository and search are abstraction (traits)
[ ] File repository implements PromptRepository trait
[ ] Fuzzy search implements SearchService trait
[ ] All tests pass with 95%+ coverage
[ ] Can swap file storage for database without changing domain
```

---

## Testing Strategy

```rust
// Domain layer tests (pure logic, no I/O)
#[cfg(test)]
mod domain_tests {
    #[test]
    fn prompt_validation_rejects_empty_name() {
        let prompt = Prompt { name: "".into(), ..Default::default() };
        assert!(prompt.validate().is_err());
    }

    #[test]
    fn frecency_score_decays_over_time() {
        let score = FrecencyScore::new(10, Utc::now() - Duration::days(30));
        assert!(score.calculate() < 10.0);
    }
}

// Infrastructure tests (with mocks)
#[cfg(test)]
mod infrastructure_tests {
    #[test]
    fn file_repository_saves_and_loads() {
        let repo = FilePromptRepository::new().unwrap();
        let prompt = create_test_prompt();
        repo.save(&prompt).unwrap();
        let loaded = repo.find_by_id(&prompt.id.into()).unwrap();
        assert_eq!(prompt.name, loaded.name);
    }
}
```

---

## Report Back

When complete, report:
1. **Architecture validation**: Dependency direction correct?
2. **Files created**: List all modules
3. **Test coverage**: Percentage covered
4. **Design patterns used**: Repository, Strategy, etc.
5. **Any deviations from plan**

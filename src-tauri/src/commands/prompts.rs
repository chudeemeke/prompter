// Tauri commands - Presentation layer
// Thin wrappers that delegate to use cases

use crate::storage::{
    FilePromptRepository, FrecencyCalculator, FuzzySearchService,
    Prompt, PromptId, PromptRepository, RecordUsageUseCase, SavePromptUseCase,
    SearchPromptsUseCase, SearchResult,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// =============================================================================
// INPUT TYPES
// =============================================================================

/// Input for creating a new prompt
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePromptInput {
    pub name: String,
    pub description: String,
    pub content: String,
    #[serde(default)]
    pub folder: Option<String>,
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub variables: Option<Vec<VariableInput>>,
    #[serde(default)]
    pub auto_paste: Option<bool>,
}

/// Input for updating an existing prompt
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdatePromptInput {
    pub id: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub content: Option<String>,
    #[serde(default)]
    pub folder: Option<String>,
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
    #[serde(default)]
    pub variables: Option<Vec<VariableInput>>,
    #[serde(default)]
    pub auto_paste: Option<bool>,
    #[serde(default)]
    pub is_favorite: Option<bool>,
}

/// Variable input (matches frontend PromptVariable)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariableInput {
    pub name: String,
    pub default: String,
    pub required: bool,
}

// =============================================================================
// CORE CRUD COMMANDS
// =============================================================================

#[tauri::command(rename_all = "snake_case")]
pub async fn get_all_prompts() -> Result<Vec<Prompt>, String> {
    let repository = FilePromptRepository::new()?;
    repository.find_all()
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_prompt(id: String) -> Result<Prompt, String> {
    let repository = FilePromptRepository::new()?;
    repository.find_by_id(&PromptId::new(id))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn create_prompt(input: CreatePromptInput) -> Result<Prompt, String> {
    let repository = FilePromptRepository::new()?;
    let now = Utc::now().to_rfc3339();

    // Generate a unique filename-safe ID
    let folder = input.folder.clone().unwrap_or_else(|| "General".to_string());
    let sanitized_name = sanitize_filename(&input.name);
    let uuid_suffix = &Uuid::new_v4().to_string()[..8];
    let id = format!("{}/{}-{}.md", folder, sanitized_name, uuid_suffix);

    let variables = input.variables.unwrap_or_default()
        .into_iter()
        .map(|v| crate::storage::domain::entities::Variable {
            name: v.name,
            default: v.default,
            required: v.required,
        })
        .collect();

    let prompt = Prompt {
        id: id.clone(),
        name: input.name,
        description: input.description,
        content: input.content,
        folder,
        icon: input.icon.unwrap_or_else(|| "📝".to_string()),
        color: input.color.unwrap_or_else(|| "#3B82F6".to_string()),
        tags: input.tags.unwrap_or_default(),
        variables,
        auto_paste: input.auto_paste.unwrap_or(true),
        is_favorite: false,
        created_at: now.clone(),
        updated_at: now,
    };

    prompt.validate()?;
    repository.save(&prompt)?;
    Ok(prompt)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn update_prompt(input: UpdatePromptInput) -> Result<Prompt, String> {
    let repository = FilePromptRepository::new()?;

    // Load existing prompt
    let mut prompt = repository.find_by_id(&PromptId::new(&input.id))?;

    // Apply updates
    if let Some(name) = input.name {
        prompt.name = name;
    }
    if let Some(description) = input.description {
        prompt.description = description;
    }
    if let Some(content) = input.content {
        prompt.content = content;
    }
    if let Some(folder) = input.folder {
        prompt.folder = folder;
    }
    if let Some(icon) = input.icon {
        prompt.icon = icon;
    }
    if let Some(color) = input.color {
        prompt.color = color;
    }
    if let Some(tags) = input.tags {
        prompt.tags = tags;
    }
    if let Some(variables) = input.variables {
        prompt.variables = variables.into_iter()
            .map(|v| crate::storage::domain::entities::Variable {
                name: v.name,
                default: v.default,
                required: v.required,
            })
            .collect();
    }
    if let Some(auto_paste) = input.auto_paste {
        prompt.auto_paste = auto_paste;
    }
    if let Some(is_favorite) = input.is_favorite {
        prompt.is_favorite = is_favorite;
    }

    // Update timestamp
    prompt.updated_at = Utc::now().to_rfc3339();

    prompt.validate()?;
    repository.save(&prompt)?;
    Ok(prompt)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_prompt(id: String) -> Result<(), String> {
    let repository = FilePromptRepository::new()?;
    repository.delete(&PromptId::new(id))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn duplicate_prompt(id: String, new_name: Option<String>) -> Result<Prompt, String> {
    let repository = FilePromptRepository::new()?;
    let now = Utc::now().to_rfc3339();

    // Load existing prompt
    let original = repository.find_by_id(&PromptId::new(&id))?;

    // Create new prompt with new ID
    let name = new_name.unwrap_or_else(|| format!("{} (Copy)", original.name));
    let sanitized_name = sanitize_filename(&name);
    let uuid_suffix = &Uuid::new_v4().to_string()[..8];
    let new_id = format!("{}/{}-{}.md", original.folder, sanitized_name, uuid_suffix);

    let duplicated = Prompt {
        id: new_id,
        name,
        description: original.description,
        content: original.content,
        folder: original.folder,
        icon: original.icon,
        color: original.color,
        tags: original.tags,
        variables: original.variables,
        auto_paste: original.auto_paste,
        is_favorite: false, // Duplicates start as non-favorite
        created_at: now.clone(),
        updated_at: now,
    };

    repository.save(&duplicated)?;
    Ok(duplicated)
}

// =============================================================================
// SEARCH & FILTERING COMMANDS
// =============================================================================

#[tauri::command(rename_all = "snake_case")]
pub async fn search_prompts(query: String) -> Result<Vec<SearchResult>, String> {
    let repository = FilePromptRepository::new()?;
    let search_service = FuzzySearchService::new();
    let frecency = FrecencyCalculator::new()?;

    let use_case = SearchPromptsUseCase::new(repository, search_service, frecency);
    use_case.execute(&query)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_prompts_by_folder(folder: String) -> Result<Vec<Prompt>, String> {
    let repository = FilePromptRepository::new()?;
    let all_prompts = repository.find_all()?;

    let filtered = all_prompts
        .into_iter()
        .filter(|p| p.folder.eq_ignore_ascii_case(&folder))
        .collect();

    Ok(filtered)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_prompts_by_tag(tag: String) -> Result<Vec<Prompt>, String> {
    let repository = FilePromptRepository::new()?;
    let all_prompts = repository.find_all()?;

    let filtered = all_prompts
        .into_iter()
        .filter(|p| p.tags.iter().any(|t| t.eq_ignore_ascii_case(&tag)))
        .collect();

    Ok(filtered)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_favorite_prompts() -> Result<Vec<Prompt>, String> {
    let repository = FilePromptRepository::new()?;
    let all_prompts = repository.find_all()?;

    let filtered = all_prompts
        .into_iter()
        .filter(|p| p.is_favorite)
        .collect();

    Ok(filtered)
}

// =============================================================================
// ORGANIZATION COMMANDS
// =============================================================================

/// Folder info returned to frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FolderInfo {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub prompt_count: usize,
}

/// Tag info returned to frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagInfo {
    pub name: String,
    pub prompt_count: usize,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_folders() -> Result<Vec<FolderInfo>, String> {
    let repository = FilePromptRepository::new()?;
    let all_prompts = repository.find_all()?;

    // Count prompts per folder
    let mut folder_counts: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    for prompt in &all_prompts {
        *folder_counts.entry(prompt.folder.clone()).or_insert(0) += 1;
    }

    let folders: Vec<FolderInfo> = folder_counts
        .into_iter()
        .map(|(name, count)| FolderInfo {
            id: name.clone(),
            name,
            parent_id: None, // Flat folder structure for now
            prompt_count: count,
        })
        .collect();

    Ok(folders)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_tags() -> Result<Vec<TagInfo>, String> {
    let repository = FilePromptRepository::new()?;
    let all_prompts = repository.find_all()?;

    // Count prompts per tag
    let mut tag_counts: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    for prompt in &all_prompts {
        for tag in &prompt.tags {
            *tag_counts.entry(tag.clone()).or_insert(0) += 1;
        }
    }

    let tags: Vec<TagInfo> = tag_counts
        .into_iter()
        .map(|(name, count)| TagInfo {
            name,
            prompt_count: count,
        })
        .collect();

    Ok(tags)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn toggle_favorite(id: String) -> Result<bool, String> {
    let repository = FilePromptRepository::new()?;

    // Load existing prompt
    let mut prompt = repository.find_by_id(&PromptId::new(&id))?;

    // Toggle favorite
    prompt.is_favorite = !prompt.is_favorite;
    prompt.updated_at = Utc::now().to_rfc3339();

    repository.save(&prompt)?;
    Ok(prompt.is_favorite)
}

// =============================================================================
// FOLDER MANAGEMENT COMMANDS
// =============================================================================

#[tauri::command(rename_all = "snake_case")]
pub async fn create_folder(name: String, parent_id: Option<String>) -> Result<FolderInfo, String> {
    use std::fs;

    let repository = FilePromptRepository::new()?;
    let prompts_dir = repository.get_prompts_dir();

    // Build folder path
    let folder_path = if let Some(parent) = parent_id.as_ref() {
        prompts_dir.join(parent).join(&name)
    } else {
        prompts_dir.join(&name)
    };

    // Create the directory
    fs::create_dir_all(&folder_path)
        .map_err(|e| format!("Failed to create folder: {}", e))?;

    Ok(FolderInfo {
        id: name.clone(),
        name,
        parent_id,
        prompt_count: 0,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn delete_folder(id: String) -> Result<(), String> {
    use std::fs;

    let repository = FilePromptRepository::new()?;
    let prompts_dir = repository.get_prompts_dir();
    let folder_path = prompts_dir.join(&id);

    // Check if folder is empty
    let all_prompts = repository.find_all()?;
    let prompts_in_folder: Vec<_> = all_prompts
        .iter()
        .filter(|p| p.folder.eq_ignore_ascii_case(&id))
        .collect();

    if !prompts_in_folder.is_empty() {
        return Err(format!(
            "Cannot delete folder '{}': contains {} prompts",
            id,
            prompts_in_folder.len()
        ));
    }

    // Delete the folder
    if folder_path.exists() {
        fs::remove_dir(&folder_path)
            .map_err(|e| format!("Failed to delete folder: {}", e))?;
    }

    Ok(())
}

// =============================================================================
// VERSION HISTORY COMMANDS
// =============================================================================

/// Version history entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionInfo {
    pub id: String,
    pub prompt_id: String,
    pub version_number: i32,
    pub content: String,
    pub name: String,
    pub description: String,
    pub change_summary: Option<String>,
    pub created_at: String,
    pub created_by: Option<String>,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_version_history(prompt_id: String) -> Result<Vec<VersionInfo>, String> {
    use std::fs;

    let repository = FilePromptRepository::new()?;
    let prompts_dir = repository.get_prompts_dir();

    // Version history is stored in .versions/<prompt_id>/
    let versions_dir = prompts_dir.join(".versions").join(&prompt_id);

    if !versions_dir.exists() {
        return Ok(vec![]);
    }

    let mut versions: Vec<VersionInfo> = Vec::new();

    for entry in fs::read_dir(&versions_dir)
        .map_err(|e| format!("Failed to read versions directory: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if path.extension().map_or(false, |ext| ext == "json") {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read version file: {}", e))?;
            let version: VersionInfo = serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse version: {}", e))?;
            versions.push(version);
        }
    }

    // Sort by version number descending
    versions.sort_by(|a, b| b.version_number.cmp(&a.version_number));

    Ok(versions)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn restore_version(prompt_id: String, version_id: String) -> Result<Prompt, String> {
    use std::fs;

    let repository = FilePromptRepository::new()?;
    let prompts_dir = repository.get_prompts_dir();

    // Load version
    let version_path = prompts_dir
        .join(".versions")
        .join(&prompt_id)
        .join(format!("{}.json", version_id));

    let version_content = fs::read_to_string(&version_path)
        .map_err(|e| format!("Failed to read version: {}", e))?;
    let version: VersionInfo = serde_json::from_str(&version_content)
        .map_err(|e| format!("Failed to parse version: {}", e))?;

    // Load current prompt
    let mut prompt = repository.find_by_id(&PromptId::new(&prompt_id))?;

    // Save current state as new version before restoring
    save_version(&prompts_dir, &prompt, Some("Before restore".to_string()))?;

    // Restore from version
    prompt.content = version.content;
    prompt.name = version.name;
    prompt.description = version.description;
    prompt.updated_at = Utc::now().to_rfc3339();

    repository.save(&prompt)?;

    Ok(prompt)
}

/// Helper to save a version of a prompt
fn save_version(
    prompts_dir: &std::path::Path,
    prompt: &Prompt,
    change_summary: Option<String>,
) -> Result<(), String> {
    use std::fs;

    let versions_dir = prompts_dir.join(".versions").join(&prompt.id);
    fs::create_dir_all(&versions_dir)
        .map_err(|e| format!("Failed to create versions directory: {}", e))?;

    // Count existing versions
    let version_count = fs::read_dir(&versions_dir)
        .map(|entries| entries.filter_map(|e| e.ok()).count())
        .unwrap_or(0);

    let version = VersionInfo {
        id: Uuid::new_v4().to_string(),
        prompt_id: prompt.id.clone(),
        version_number: (version_count + 1) as i32,
        content: prompt.content.clone(),
        name: prompt.name.clone(),
        description: prompt.description.clone(),
        change_summary,
        created_at: Utc::now().to_rfc3339(),
        created_by: None,
    };

    let version_path = versions_dir.join(format!("{}.json", version.id));
    let content = serde_json::to_string_pretty(&version)
        .map_err(|e| format!("Failed to serialize version: {}", e))?;

    fs::write(&version_path, content)
        .map_err(|e| format!("Failed to write version: {}", e))?;

    Ok(())
}

// =============================================================================
// USAGE COMMANDS
// =============================================================================

/// Usage statistics for a prompt
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageStatsInfo {
    pub prompt_id: String,
    pub use_count: i32,
    pub last_used: String,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn record_usage(prompt_id: String) -> Result<(), String> {
    let frecency = FrecencyCalculator::new()?;
    let mut use_case = RecordUsageUseCase::new(frecency);
    use_case.execute(&PromptId::new(prompt_id))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_usage_stats(prompt_id: String) -> Result<UsageStatsInfo, String> {
    let frecency = FrecencyCalculator::new()?;

    // Get usage data from frecency calculator
    let usage = frecency.get_usage(&prompt_id);

    let (use_count, last_used) = match usage {
        Some(u) => (u.use_count as i32, u.last_used),
        None => (0, "never".to_string()),
    };

    Ok(UsageStatsInfo {
        prompt_id,
        use_count,
        last_used,
    })
}

// Legacy alias for save_prompt (used by older code)
#[tauri::command(rename_all = "snake_case")]
pub async fn save_prompt(prompt: Prompt) -> Result<(), String> {
    let repository = FilePromptRepository::new()?;
    let use_case = SavePromptUseCase::new(repository);
    use_case.execute(&prompt)
}

// =============================================================================
// CONFIGURATION COMMANDS
// =============================================================================

/// Application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfigInfo {
    // General
    pub hotkey: String,
    pub prompts_dir: String,
    pub theme: String,
    pub language: String,

    // Behavior
    pub auto_paste: bool,
    pub close_after_paste: bool,
    pub remember_last_query: bool,
    pub auto_start: bool,

    // Display
    pub show_in_tray: bool,
    pub max_results: i32,
    pub max_recent_prompts: i32,
    pub show_keyboard_hints: bool,

    // Editor
    pub editor_font_size: i32,
    pub editor_word_wrap: bool,

    // Advanced
    pub backup_enabled: bool,
    pub backup_interval_hours: i32,
    pub analytics_enabled: bool,
}

impl Default for AppConfigInfo {
    fn default() -> Self {
        Self {
            hotkey: "F9".to_string(),
            prompts_dir: "~/.prompter/prompts".to_string(),
            theme: "dark".to_string(),
            language: "en".to_string(),
            auto_paste: true,
            close_after_paste: true,
            remember_last_query: false,
            auto_start: false,
            show_in_tray: true,
            max_results: 10,
            max_recent_prompts: 5,
            show_keyboard_hints: true,
            editor_font_size: 14,
            editor_word_wrap: true,
            backup_enabled: true,
            backup_interval_hours: 24,
            analytics_enabled: true,
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_config() -> Result<AppConfigInfo, String> {
    use std::fs;

    let config_path = get_config_path()?;

    if !config_path.exists() {
        // Return default config
        return Ok(AppConfigInfo::default());
    }

    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse config: {}", e))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn update_config(config: AppConfigInfo) -> Result<AppConfigInfo, String> {
    use std::fs;

    let config_path = get_config_path()?;

    // Ensure parent directory exists
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(config)
}

fn get_config_path() -> Result<std::path::PathBuf, String> {
    dirs::home_dir()
        .map(|home| home.join(".prompter").join("config.json"))
        .ok_or_else(|| "Could not determine home directory".to_string())
}

// =============================================================================
// IMPORT/EXPORT COMMANDS
// =============================================================================

#[tauri::command(rename_all = "snake_case")]
pub async fn export_prompt(id: String) -> Result<String, String> {
    let repository = FilePromptRepository::new()?;
    let prompt = repository.find_by_id(&PromptId::new(&id))?;

    // Export as YAML (matches file format)
    serde_yaml::to_string(&prompt)
        .map_err(|e| format!("Failed to export prompt: {}", e))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn import_prompt(content: String) -> Result<Prompt, String> {
    // Try parsing as YAML first, then JSON
    let mut prompt: Prompt = serde_yaml::from_str(&content)
        .or_else(|_| serde_json::from_str(&content))
        .map_err(|e| format!("Failed to parse prompt: {}", e))?;

    // Generate new ID to avoid conflicts
    let now = Utc::now().to_rfc3339();
    let sanitized_name = sanitize_filename(&prompt.name);
    let uuid_suffix = &Uuid::new_v4().to_string()[..8];
    prompt.id = format!("{}/{}-{}.md", prompt.folder, sanitized_name, uuid_suffix);
    prompt.created_at = now.clone();
    prompt.updated_at = now;

    // Save the imported prompt
    let repository = FilePromptRepository::new()?;
    repository.save(&prompt)?;

    Ok(prompt)
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/// Sanitize a string to be used as a filename
fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' || c == ' ' {
                c
            } else {
                '-'
            }
        })
        .collect::<String>()
        .replace("  ", " ")
        .trim()
        .to_lowercase()
        .replace(' ', "-")
}


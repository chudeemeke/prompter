# API Contracts - Type Definitions & Command Signatures

This document defines all shared interfaces between frontend (TypeScript) and backend (Rust).

---

## TypeScript Interfaces

Location: `src/lib/types.ts`

### Prompt

```typescript
export interface Prompt {
  id: string;                    // Relative path: "research/ai-news.md"
  name: string;                  // "AI News Summary"
  description?: string;          // "Get the latest AI news"
  content: string;               // The actual prompt text
  icon?: string;                 // Icon name: "newspaper"
  color?: string;                // Hex color: "#3B82F6"
  folder?: string;               // Folder name: "Research"
  variables?: Variable[];        // Template variables
  tags?: string[];               // ["news", "research"]
  created: string;               // ISO 8601 date string
  modified: string;              // ISO 8601 date string
}
```

### Variable

```typescript
export interface Variable {
  name: string;                  // "topic"
  default?: string;              // "AI"
  required: boolean;             // false
}
```

### SearchResult

```typescript
export interface SearchResult {
  prompt: Prompt;
  score: number;                 // Fuzzy match score
  matches: MatchRange[];         // Where matches occurred
}
```

### MatchRange

```typescript
export interface MatchRange {
  field: 'name' | 'description' | 'content' | 'tags';
  start: number;
  end: number;
}
```

### Settings

```typescript
export interface Settings {
  hotkey: string;                // "Ctrl+Space"
  promptsDir: string;            // "~/.prompter/prompts"
  theme: 'light' | 'dark' | 'system';
  autoPaste: boolean;            // Simulate Ctrl+V after copy
  showInTray: boolean;
  maxResults: number;            // 10
  maxRecentPrompts: number;      // 5
  externalEditor: {
    enabled: boolean;
    app: 'notepad' | 'notepad++' | 'vscode' | 'custom';
    customPath?: string;
  };
  ui: {
    showPreviewPane: boolean;
    showSidebar: boolean;
    windowWidth: number;         // 700
    windowHeight: number;        // 500
  };
}
```

### UsageStats

```typescript
export interface UsageStats {
  promptId: string;
  useCount: number;
  lastUsed: string;              // ISO 8601 date string
}
```

---

## Rust Structs

Location: `src-tauri/src/commands/mod.rs`

These MUST match the TypeScript interfaces exactly for serde serialization.

```rust
use serde::{Deserialize, Serialize};

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub prompt: Prompt,
    pub score: i64,
    pub matches: Vec<MatchRange>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchRange {
    pub field: String,
    pub start: usize,
    pub end: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub hotkey: String,
    pub prompts_dir: String,
    pub theme: String,
    pub auto_paste: bool,
    pub show_in_tray: bool,
    pub max_results: usize,
    pub max_recent_prompts: usize,
    pub external_editor: ExternalEditor,
    pub ui: UiSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExternalEditor {
    pub enabled: bool,
    pub app: String,
    pub custom_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiSettings {
    pub show_preview_pane: bool,
    pub show_sidebar: bool,
    pub window_width: u32,
    pub window_height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageStats {
    pub prompt_id: String,
    pub use_count: u32,
    pub last_used: String,
}
```

---

## Tauri Commands

All commands use `#[tauri::command]` macro and return `Result<T, String>`.

### Data Layer Commands

Implemented by Agent A in `src-tauri/src/commands/prompts.rs` and `search.rs`.

```rust
/// Get all prompts from disk
#[tauri::command]
async fn get_all_prompts() -> Result<Vec<Prompt>, String>;

/// Get a single prompt by ID
#[tauri::command]
async fn get_prompt(id: String) -> Result<Prompt, String>;

/// Save a prompt (create or update)
#[tauri::command]
async fn save_prompt(prompt: Prompt) -> Result<(), String>;

/// Delete a prompt by ID
#[tauri::command]
async fn delete_prompt(id: String) -> Result<(), String>;

/// Search prompts with fuzzy matching
#[tauri::command]
async fn search_prompts(query: String) -> Result<Vec<SearchResult>, String>;

/// Record that a prompt was used (for frecency)
#[tauri::command]
async fn record_prompt_usage(id: String) -> Result<(), String>;

/// Get recent prompts list
#[tauri::command]
async fn get_recent_prompts() -> Result<Vec<Prompt>, String>;
```

### OS Integration Commands

Implemented by Agent B in `src-tauri/src/commands/clipboard.rs`.

```rust
/// Copy text to clipboard, hide window, restore focus, optionally paste
#[tauri::command]
async fn copy_and_paste(
    app: tauri::AppHandle,
    text: String,
    auto_paste: bool,
) -> Result<(), String>;

/// Hide window and restore focus (for Escape key)
#[tauri::command]
async fn hide_and_restore(app: tauri::AppHandle) -> Result<(), String>;
```

### Settings Commands

```rust
/// Get user settings
#[tauri::command]
async fn get_settings() -> Result<Settings, String>;

/// Save user settings
#[tauri::command]
async fn save_settings(settings: Settings) -> Result<(), String>;
```

---

## Frontend API Wrapper

Location: `src/lib/tauri.ts`

TypeScript wrapper for Tauri invoke calls:

```typescript
import { invoke } from '@tauri-apps/api/core';
import type { Prompt, SearchResult, Settings } from './types';

// Prompts
export async function getAllPrompts(): Promise<Prompt[]> {
  return invoke('get_all_prompts');
}

export async function getPrompt(id: string): Promise<Prompt> {
  return invoke('get_prompt', { id });
}

export async function savePrompt(prompt: Prompt): Promise<void> {
  return invoke('save_prompt', { prompt });
}

export async function deletePrompt(id: string): Promise<void> {
  return invoke('delete_prompt', { id });
}

export async function searchPrompts(query: string): Promise<SearchResult[]> {
  return invoke('search_prompts', { query });
}

export async function recordPromptUsage(id: string): Promise<void> {
  return invoke('record_prompt_usage', { id });
}

export async function getRecentPrompts(): Promise<Prompt[]> {
  return invoke('get_recent_prompts');
}

// Clipboard
export async function copyAndPaste(text: string, autoPaste: boolean): Promise<void> {
  return invoke('copy_and_paste', { text, autoPaste });
}

export async function hideAndRestore(): Promise<void> {
  return invoke('hide_and_restore');
}

// Settings
export async function getSettings(): Promise<Settings> {
  return invoke('get_settings');
}

export async function saveSettings(settings: Settings): Promise<void> {
  return invoke('save_settings', { settings });
}
```

---

## Events

Tauri events emitted from backend to frontend:

### focus-search

Emitted when: Hotkey pressed or window shown
Payload: None
Frontend action: Focus search input, select all text

```typescript
import { listen } from '@tauri-apps/api/event';

listen('focus-search', () => {
  searchInputRef.current?.focus();
  searchInputRef.current?.select();
});
```

### prompts-changed

Emitted when: File watcher detects external changes
Payload: None
Frontend action: Reload prompts list

```typescript
listen('prompts-changed', async () => {
  const updatedPrompts = await getAllPrompts();
  setPrompts(updatedPrompts);
});
```

---

## Error Handling

All Tauri commands return `Result<T, String>`. Frontend should handle errors:

```typescript
try {
  const prompts = await getAllPrompts();
  setPrompts(prompts);
} catch (error) {
  console.error('Failed to load prompts:', error);
  showErrorToast('Could not load prompts. Please check ~/.prompter/prompts/');
}
```

---

## Type Validation

To ensure TypeScript and Rust types stay in sync:

1. **During development:** Manual verification
2. **Testing:** Integration tests that serialize/deserialize
3. **Future:** Consider `ts-rs` crate to auto-generate TypeScript from Rust

---

## Version Compatibility

Current API version: **v1.0.0**

Breaking changes will increment major version.

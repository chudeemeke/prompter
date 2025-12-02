// Core domain types - shared across all agents
// READ ONLY during Phase 2 (parallel agent development)

export interface Prompt {
  id: string;
  name: string;
  description: string;
  content: string;
  folder: string;
  icon: string;
  color: string;
  tags: string[];
  variables: PromptVariable[];
  auto_paste: boolean;  // Changed to snake_case to match Rust
  created_at: string;   // Changed to snake_case to match Rust
  updated_at: string;   // Changed to snake_case to match Rust
}

export interface PromptVariable {
  name: string;
  default: string;
  required: boolean;
}

export interface SearchResult {
  prompt: Prompt;
  score: number;
  highlights: string[];
}

export interface UsageStats {
  prompt_id: string;
  use_count: number;
  last_used: string;
}

export interface FrecencyScore {
  prompt_id: string;
  score: number;
}

export interface AppConfig {
  hotkey: string;
  prompts_dir: string;
  theme: 'dark' | 'light' | 'system';
  auto_paste: boolean;
  show_in_tray: boolean;
  max_results: number;
  max_recent_prompts: number;
  external_editor: {
    enabled: boolean;
    app: string;
  };
  ui: {
    show_preview_pane: boolean;
    show_sidebar: boolean;
    window_width: number;
    window_height: number;
  };
}

// Tauri command responses
export interface CommandResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// UI state types
export interface SpotlightState {
  is_visible: boolean;
  query: string;
  selected_index: number;
  results: SearchResult[];
  selected_prompt: Prompt | null;
  show_variable_modal: boolean;
}

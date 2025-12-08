// =============================================================================
// PROMPTER TYPE DEFINITIONS
// =============================================================================
// Core domain types following snake_case to match Rust backend
// All types are designed for extensibility and type safety

// =============================================================================
// CORE DOMAIN TYPES
// =============================================================================

/**
 * Core Prompt entity - the main domain object
 */
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
  auto_paste: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Variable definition for prompts with placeholders
 */
export interface PromptVariable {
  name: string;
  default: string;
  required: boolean;
  description?: string;
  validation_regex?: string;
}

/**
 * Search result with scoring and match highlights
 */
export interface SearchResult {
  prompt: Prompt;
  score: number;
  highlights: string[];
}

// =============================================================================
// VERSION HISTORY TYPES
// =============================================================================

/**
 * A single version of a prompt for history tracking
 */
export interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  content: string;
  name: string;
  description: string;
  change_summary?: string;
  created_at: string;
  created_by?: string;
}

/**
 * Version comparison result
 */
export interface VersionDiff {
  from_version: number;
  to_version: number;
  additions: number;
  deletions: number;
  diff_lines: DiffLine[];
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  line_number: number;
}

// =============================================================================
// USAGE & ANALYTICS TYPES
// =============================================================================

/**
 * Time-based usage data point
 */
export interface UsageDataPoint {
  period: string;
  count: number;
}

/**
 * Usage statistics for a prompt
 */
export interface UsageStats {
  prompt_id: string;
  total_uses: number;
  last_used: string | null;
  daily_uses: UsageDataPoint[];
  weekly_uses: UsageDataPoint[];
  monthly_uses: UsageDataPoint[];
}

/**
 * Frecency score for ranking
 */
export interface FrecencyScore {
  prompt_id: string;
  score: number;
}

/**
 * Extended analytics for a single prompt
 */
export interface PromptAnalytics {
  prompt_id: string;
  prompt_name: string;
  total_uses: number;
  uses_today: number;
  uses_this_week: number;
  uses_this_month: number;
  avg_uses_per_day: number;
  streak_days: number;
  peak_hour: number;
  last_used: string;
  first_used: string;
  trend: 'rising' | 'stable' | 'declining';
}

/**
 * Daily usage data point for charts
 */
export interface DailyUsage {
  date: string;
  count: number;
}

/**
 * Hourly usage distribution
 */
export interface HourlyDistribution {
  hour: number;
  count: number;
}

/**
 * Global analytics summary
 */
export interface AnalyticsSummary {
  total_prompts: number;
  total_uses: number;
  uses_today: number;
  uses_this_week: number;
  active_prompts: number;
  top_prompts: PromptAnalytics[];
  daily_usage: DailyUsage[];
  hourly_distribution: HourlyDistribution[];
}

// =============================================================================
// ORGANIZATION TYPES
// =============================================================================

/**
 * Folder for organizing prompts
 */
export interface PromptFolder {
  id: string;
  name: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  prompt_count: number;
  created_at: string;
}

/**
 * Tag for categorizing prompts
 */
export interface PromptTag {
  name: string;
  color?: string;
  prompt_count: number;
}

/**
 * Folder tree node for hierarchical display
 */
export interface FolderTreeNode {
  folder: PromptFolder;
  children: FolderTreeNode[];
  is_expanded: boolean;
}

// =============================================================================
// SETTINGS TYPES
// =============================================================================

/**
 * Theme options
 */
export type Theme = 'dark' | 'light' | 'system';

/**
 * Application configuration
 */
export interface AppConfig {
  // General
  hotkey: string;
  prompts_dir: string;
  theme: Theme;
  language: string;

  // Behavior
  auto_paste: boolean;
  close_after_paste: boolean;
  remember_last_query: boolean;
  remember_last_edited_prompt: boolean;
  last_edited_prompt_id?: string;
  auto_start: boolean;

  // Display
  show_in_tray: boolean;
  max_results: number;
  max_recent_prompts: number;
  show_keyboard_hints: boolean;

  // Editor
  external_editor: ExternalEditorConfig;
  editor_font_size: number;
  editor_word_wrap: boolean;

  // UI
  ui: UIConfig;

  // Advanced
  backup_enabled: boolean;
  backup_interval_hours: number;
  analytics_enabled: boolean;
}

export interface ExternalEditorConfig {
  enabled: boolean;
  app: string;
  args: string[];
}

export interface UIConfig {
  show_preview_pane: boolean;
  show_sidebar: boolean;
  window_width: number;
  window_height: number;
  sidebar_width: number;
  preview_position: 'right' | 'bottom';
}

// =============================================================================
// EDITOR STATE TYPES
// =============================================================================

/**
 * Editor mode
 */
export type EditorMode = 'create' | 'edit' | 'view';

/**
 * Editor state
 */
export interface EditorState {
  mode: EditorMode;
  prompt: Prompt | null;
  is_dirty: boolean;
  is_saving: boolean;
  errors: Record<string, string>;
  active_tab: 'content' | 'variables' | 'metadata' | 'history';
}

/**
 * Validation result
 */
export interface ValidationResult {
  is_valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// =============================================================================
// CLIPBOARD TYPES
// =============================================================================

/**
 * Result from copy and paste operation
 * Provides detailed feedback about what succeeded/failed
 */
export interface CopyPasteResult {
  /** Whether text was successfully copied to clipboard */
  clipboard_success: boolean;
  /** Whether auto-paste was attempted */
  paste_attempted: boolean;
  /** Whether paste is likely to have succeeded (best guess) */
  paste_likely_success: boolean;
  /** User-friendly message describing what happened */
  message: string;
}

// =============================================================================
// COMMAND TYPES
// =============================================================================

/**
 * Generic command result wrapper
 */
export interface CommandResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Batch operation result
 */
export interface BatchResult {
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

// =============================================================================
// UI STATE TYPES
// =============================================================================

/**
 * Spotlight window state
 */
export interface SpotlightState {
  is_visible: boolean;
  query: string;
  selected_index: number;
  results: SearchResult[];
  selected_prompt: Prompt | null;
  show_variable_modal: boolean;
}

/**
 * Window types in the application
 */
export type WindowType = 'spotlight' | 'editor' | 'settings' | 'analytics';

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

/**
 * Modal state
 */
export interface ModalState {
  is_open: boolean;
  title?: string;
  content?: React.ReactNode;
  on_confirm?: () => void;
  on_cancel?: () => void;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Sortable fields for prompts
 */
export type PromptSortField = 'name' | 'created_at' | 'updated_at' | 'use_count' | 'frecency';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Filter options for prompt listing
 */
export interface PromptFilters {
  folder?: string;
  tags?: string[];
  search?: string;
  is_favorite?: boolean;
  sort_by?: PromptSortField;
  sort_direction?: SortDirection;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  per_page: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

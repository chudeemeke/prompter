import type {
  Prompt,
  SearchResult,
  PromptFolder,
  PromptTag,
  PromptVersion,
  UsageStats,
  AppConfig,
  CopyPasteResult,
} from '../lib/types';

// =============================================================================
// CREATE/UPDATE INPUT TYPES
// =============================================================================

/**
 * Input for creating a new prompt
 */
export interface CreatePromptInput {
  name: string;
  description: string;
  content: string;
  folder?: string;
  icon?: string;
  color?: string;
  tags?: string[];
  variables?: Array<{
    name: string;
    default: string;
    required: boolean;
    description?: string;
    validation_regex?: string;
  }>;
  auto_paste?: boolean;
}

/**
 * Input for updating an existing prompt
 */
export interface UpdatePromptInput extends Partial<CreatePromptInput> {
  id: string;
}

// =============================================================================
// PROMPT SERVICE INTERFACE
// =============================================================================

/**
 * Prompt service interface (abstraction)
 * Allows swapping implementations (Tauri, Mock, API, etc.)
 *
 * Follows Interface Segregation Principle - methods grouped by domain
 */
export interface PromptService {
  // ---------------------------------------------------------------------------
  // CORE CRUD OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Get all prompts
   */
  getAllPrompts(): Promise<Prompt[]>;

  /**
   * Get a single prompt by ID
   */
  getPrompt(id: string): Promise<Prompt>;

  /**
   * Create a new prompt
   */
  createPrompt(input: CreatePromptInput): Promise<Prompt>;

  /**
   * Update an existing prompt
   */
  updatePrompt(input: UpdatePromptInput): Promise<Prompt>;

  /**
   * Delete a prompt by ID
   */
  deletePrompt(id: string): Promise<void>;

  /**
   * Duplicate a prompt with a new name
   */
  duplicatePrompt(id: string, newName?: string): Promise<Prompt>;

  // ---------------------------------------------------------------------------
  // SEARCH & FILTERING
  // ---------------------------------------------------------------------------

  /**
   * Search prompts with fuzzy matching
   */
  searchPrompts(query: string): Promise<SearchResult[]>;

  /**
   * Get prompts by folder
   */
  getPromptsByFolder(folder: string): Promise<Prompt[]>;

  /**
   * Get prompts by tag
   */
  getPromptsByTag(tag: string): Promise<Prompt[]>;

  /**
   * Get favorite prompts
   */
  getFavoritePrompts(): Promise<Prompt[]>;

  // ---------------------------------------------------------------------------
  // ORGANIZATION
  // ---------------------------------------------------------------------------

  /**
   * Get all folders
   */
  getFolders(): Promise<PromptFolder[]>;

  /**
   * Create a new folder
   */
  createFolder(name: string, parentId?: string): Promise<PromptFolder>;

  /**
   * Delete a folder (moves prompts to root)
   */
  deleteFolder(id: string): Promise<void>;

  /**
   * Get all tags with counts
   */
  getTags(): Promise<PromptTag[]>;

  /**
   * Toggle favorite status
   */
  toggleFavorite(id: string): Promise<boolean>;

  // ---------------------------------------------------------------------------
  // VERSION HISTORY
  // ---------------------------------------------------------------------------

  /**
   * Get version history for a prompt
   */
  getVersionHistory(promptId: string): Promise<PromptVersion[]>;

  /**
   * Restore a specific version
   */
  restoreVersion(promptId: string, versionId: string): Promise<Prompt>;

  // ---------------------------------------------------------------------------
  // USAGE & ANALYTICS
  // ---------------------------------------------------------------------------

  /**
   * Record that a prompt was used (for frecency)
   */
  recordUsage(id: string): Promise<void>;

  /**
   * Get usage stats for a prompt
   */
  getUsageStats(id: string): Promise<UsageStats>;

  // ---------------------------------------------------------------------------
  // CLIPBOARD & WINDOW
  // ---------------------------------------------------------------------------

  /**
   * Copy prompt and paste into previous app
   * Returns detailed result about what succeeded/failed
   */
  copyAndPaste(text: string, auto_paste: boolean): Promise<CopyPasteResult>;

  /**
   * Hide window and restore focus
   */
  hideAndRestore(): Promise<void>;

  // ---------------------------------------------------------------------------
  // SETTINGS
  // ---------------------------------------------------------------------------

  /**
   * Get application configuration
   */
  getConfig(): Promise<AppConfig>;

  /**
   * Update application configuration
   */
  updateConfig(config: Partial<AppConfig>): Promise<AppConfig>;

  // ---------------------------------------------------------------------------
  // IMPORT/EXPORT
  // ---------------------------------------------------------------------------

  /**
   * Export prompt to markdown file
   */
  exportPrompt(id: string): Promise<string>;

  /**
   * Import prompt from markdown content
   */
  importPrompt(content: string): Promise<Prompt>;

  // ---------------------------------------------------------------------------
  // WINDOW MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Open the editor window
   */
  openEditorWindow(promptId?: string, mode?: 'create' | 'edit'): Promise<void>;

  /**
   * Open the settings window
   */
  openSettingsWindow(): Promise<void>;

  /**
   * Open the analytics window
   */
  openAnalyticsWindow(): Promise<void>;

  /**
   * Close a window by label
   */
  closeWindow(label: string): Promise<void>;

  // ---------------------------------------------------------------------------
  // AUTOSTART
  // ---------------------------------------------------------------------------

  /**
   * Enable auto-start on system login
   */
  enableAutostart(): Promise<void>;

  /**
   * Disable auto-start on system login
   */
  disableAutostart(): Promise<void>;

  /**
   * Check if auto-start is enabled
   */
  isAutostartEnabled(): Promise<boolean>;
}

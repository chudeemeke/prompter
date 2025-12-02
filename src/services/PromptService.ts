import type { Prompt, SearchResult } from '../lib/types';

/**
 * Prompt service interface (abstraction)
 * Allows swapping implementations (Tauri, Mock, API, etc.)
 */
export interface PromptService {
  /**
   * Get all prompts
   */
  getAllPrompts(): Promise<Prompt[]>;

  /**
   * Get a single prompt by ID
   */
  getPrompt(id: string): Promise<Prompt>;

  /**
   * Search prompts with fuzzy matching
   */
  searchPrompts(query: string): Promise<SearchResult[]>;

  /**
   * Copy prompt and paste into previous app
   */
  copyAndPaste(text: string, auto_paste: boolean): Promise<void>;

  /**
   * Hide window and restore focus
   */
  hideAndRestore(): Promise<void>;

  /**
   * Record that a prompt was used (for frecency)
   */
  recordUsage(id: string): Promise<void>;
}

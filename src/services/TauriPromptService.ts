import { invoke } from '@tauri-apps/api/core';
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
import type { PromptService, CreatePromptInput, UpdatePromptInput } from './PromptService';

/**
 * Tauri implementation of PromptService
 * Calls actual Tauri commands (Rust backend)
 */
export class TauriPromptService implements PromptService {
  // ---------------------------------------------------------------------------
  // CORE CRUD OPERATIONS
  // ---------------------------------------------------------------------------

  async getAllPrompts(): Promise<Prompt[]> {
    return invoke<Prompt[]>('get_all_prompts');
  }

  async getPrompt(id: string): Promise<Prompt> {
    return invoke<Prompt>('get_prompt', { id });
  }

  async createPrompt(input: CreatePromptInput): Promise<Prompt> {
    return invoke<Prompt>('create_prompt', { input });
  }

  async updatePrompt(input: UpdatePromptInput): Promise<Prompt> {
    return invoke<Prompt>('update_prompt', { input });
  }

  async deletePrompt(id: string): Promise<void> {
    return invoke('delete_prompt', { id });
  }

  async duplicatePrompt(id: string, newName?: string): Promise<Prompt> {
    return invoke<Prompt>('duplicate_prompt', { id, new_name: newName });
  }

  // ---------------------------------------------------------------------------
  // SEARCH & FILTERING
  // ---------------------------------------------------------------------------

  async searchPrompts(query: string): Promise<SearchResult[]> {
    return invoke<SearchResult[]>('search_prompts', { query });
  }

  async getPromptsByFolder(folder: string): Promise<Prompt[]> {
    return invoke<Prompt[]>('get_prompts_by_folder', { folder });
  }

  async getPromptsByTag(tag: string): Promise<Prompt[]> {
    return invoke<Prompt[]>('get_prompts_by_tag', { tag });
  }

  async getFavoritePrompts(): Promise<Prompt[]> {
    return invoke<Prompt[]>('get_favorite_prompts');
  }

  // ---------------------------------------------------------------------------
  // ORGANIZATION
  // ---------------------------------------------------------------------------

  async getFolders(): Promise<PromptFolder[]> {
    return invoke<PromptFolder[]>('get_folders');
  }

  async createFolder(name: string, parentId?: string): Promise<PromptFolder> {
    return invoke<PromptFolder>('create_folder', { name, parent_id: parentId });
  }

  async deleteFolder(id: string): Promise<void> {
    return invoke('delete_folder', { id });
  }

  async getTags(): Promise<PromptTag[]> {
    return invoke<PromptTag[]>('get_tags');
  }

  async toggleFavorite(id: string): Promise<boolean> {
    return invoke<boolean>('toggle_favorite', { id });
  }

  // ---------------------------------------------------------------------------
  // VERSION HISTORY
  // ---------------------------------------------------------------------------

  async getVersionHistory(promptId: string): Promise<PromptVersion[]> {
    return invoke<PromptVersion[]>('get_version_history', { prompt_id: promptId });
  }

  async restoreVersion(promptId: string, versionId: string): Promise<Prompt> {
    return invoke<Prompt>('restore_version', { prompt_id: promptId, version_id: versionId });
  }

  // ---------------------------------------------------------------------------
  // USAGE & ANALYTICS
  // ---------------------------------------------------------------------------

  async recordUsage(id: string): Promise<void> {
    return invoke('record_usage', { prompt_id: id });
  }

  async getUsageStats(id: string): Promise<UsageStats> {
    return invoke<UsageStats>('get_usage_stats', { prompt_id: id });
  }

  // ---------------------------------------------------------------------------
  // CLIPBOARD & WINDOW
  // ---------------------------------------------------------------------------

  async copyAndPaste(text: string, auto_paste: boolean): Promise<CopyPasteResult> {
    return invoke<CopyPasteResult>('copy_and_paste', { text, auto_paste: auto_paste });
  }

  async hideAndRestore(): Promise<void> {
    return invoke('hide_window');
  }

  // ---------------------------------------------------------------------------
  // SETTINGS
  // ---------------------------------------------------------------------------

  async getConfig(): Promise<AppConfig> {
    return invoke<AppConfig>('get_config');
  }

  async updateConfig(config: Partial<AppConfig>): Promise<AppConfig> {
    return invoke<AppConfig>('update_config', { config });
  }

  // ---------------------------------------------------------------------------
  // IMPORT/EXPORT
  // ---------------------------------------------------------------------------

  async exportPrompt(id: string): Promise<string> {
    return invoke<string>('export_prompt', { id });
  }

  async importPrompt(content: string): Promise<Prompt> {
    return invoke<Prompt>('import_prompt', { content });
  }

  // ---------------------------------------------------------------------------
  // WINDOW MANAGEMENT
  // ---------------------------------------------------------------------------

  async openEditorWindow(promptId?: string, mode?: 'create' | 'edit'): Promise<void> {
    return invoke('open_editor_window', { prompt_id: promptId, mode });
  }

  async openSettingsWindow(): Promise<void> {
    return invoke('open_settings_window');
  }

  async openAnalyticsWindow(): Promise<void> {
    return invoke('open_analytics_window');
  }

  async closeWindow(label: string): Promise<void> {
    return invoke('close_window', { label });
  }

  // ---------------------------------------------------------------------------
  // AUTOSTART
  // ---------------------------------------------------------------------------

  async enableAutostart(): Promise<void> {
    return invoke('enable_autostart');
  }

  async disableAutostart(): Promise<void> {
    return invoke('disable_autostart');
  }

  async isAutostartEnabled(): Promise<boolean> {
    return invoke<boolean>('is_autostart_enabled');
  }
}

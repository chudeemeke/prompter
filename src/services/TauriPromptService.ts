import { invoke } from '@tauri-apps/api/core';
import type { Prompt, SearchResult } from '../lib/types';
import type { PromptService } from './PromptService';

/**
 * Tauri implementation of PromptService
 * Calls actual Tauri commands
 */
export class TauriPromptService implements PromptService {
  async getAllPrompts(): Promise<Prompt[]> {
    return invoke<Prompt[]>('get_all_prompts');
  }

  async getPrompt(id: string): Promise<Prompt> {
    return invoke<Prompt>('get_prompt', { id });
  }

  async searchPrompts(query: string): Promise<SearchResult[]> {
    return invoke<SearchResult[]>('search_prompts', { query });
  }

  async copyAndPaste(text: string, auto_paste: boolean): Promise<void> {
    return invoke('copy_and_paste', { text, auto_paste: auto_paste });
  }

  async hideAndRestore(): Promise<void> {
    return invoke('hide_window');
  }

  async recordUsage(id: string): Promise<void> {
    return invoke('record_usage', { prompt_id: id });
  }
}

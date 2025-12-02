import { mockPrompts } from '../lib/mocks';
import type { Prompt, SearchResult } from '../lib/types';
import type { PromptService } from './PromptService';

/**
 * Mock implementation for development
 * No Tauri dependency, works in browser
 */
export class MockPromptService implements PromptService {
  private prompts: Prompt[] = mockPrompts;

  async getAllPrompts(): Promise<Prompt[]> {
    return Promise.resolve([...this.prompts]);
  }

  async getPrompt(id: string): Promise<Prompt> {
    const prompt = this.prompts.find(p => p.id === id);
    if (!prompt) {
      throw new Error(`Prompt not found: ${id}`);
    }
    return Promise.resolve(prompt);
  }

  async searchPrompts(query: string): Promise<SearchResult[]> {
    if (!query.trim()) {
      return this.prompts.map(p => ({
        prompt: p,
        score: 100,
        highlights: [],
      }));
    }

    const lowerQuery = query.toLowerCase();
    const results = this.prompts
      .filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery) ||
        p.tags?.some(t => t.toLowerCase().includes(lowerQuery)) ||
        p.content.toLowerCase().includes(lowerQuery)
      )
      .map(p => ({
        prompt: p,
        score: p.name.toLowerCase().includes(lowerQuery) ? 100 : 50,
        highlights: [],
      }));

    results.sort((a, b) => b.score - a.score);
    return Promise.resolve(results);
  }

  async copyAndPaste(text: string, auto_paste: boolean): Promise<void> {
    console.log('[Mock] Copy and paste:', { text, auto_paste });
    return Promise.resolve();
  }

  async hideAndRestore(): Promise<void> {
    console.log('[Mock] Hide and restore');
    return Promise.resolve();
  }

  async recordUsage(id: string): Promise<void> {
    console.log('[Mock] Record usage:', id);
    return Promise.resolve();
  }
}

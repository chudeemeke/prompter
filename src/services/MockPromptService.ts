import { mockPrompts } from '../lib/mocks';
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
 * Mock implementation for development
 * No Tauri dependency, works in browser
 * Full implementation for testing all features
 */
export class MockPromptService implements PromptService {
  private prompts: Prompt[] = [...mockPrompts];
  private folders: PromptFolder[] = [
    { id: 'coding', name: 'Coding', prompt_count: 2, created_at: new Date().toISOString() },
    { id: 'writing', name: 'Writing', prompt_count: 1, created_at: new Date().toISOString() },
    { id: 'research', name: 'Research', prompt_count: 0, created_at: new Date().toISOString() },
  ];
  private versions: Map<string, PromptVersion[]> = new Map();
  private usageStats: Map<string, UsageStats> = new Map();
  private config: AppConfig = {
    hotkey: 'Ctrl+Space',
    prompts_dir: '~/.prompter/prompts',
    theme: 'dark',
    language: 'en',
    auto_paste: true,
    close_after_paste: true,
    remember_last_query: false,
    auto_start: false,
    show_in_tray: true,
    max_results: 10,
    max_recent_prompts: 5,
    show_keyboard_hints: true,
    external_editor: { enabled: false, app: '', args: [] },
    editor_font_size: 14,
    editor_word_wrap: true,
    ui: {
      show_preview_pane: true,
      show_sidebar: true,
      window_width: 900,
      window_height: 600,
      sidebar_width: 250,
      preview_position: 'right',
    },
    backup_enabled: true,
    backup_interval_hours: 24,
    analytics_enabled: true,
  };

  // ---------------------------------------------------------------------------
  // CORE CRUD OPERATIONS
  // ---------------------------------------------------------------------------

  async getAllPrompts(): Promise<Prompt[]> {
    return Promise.resolve([...this.prompts]);
  }

  async getPrompt(id: string): Promise<Prompt> {
    const prompt = this.prompts.find(p => p.id === id);
    if (!prompt) {
      throw new Error(`Prompt not found: ${id}`);
    }
    return Promise.resolve({ ...prompt });
  }

  async createPrompt(input: CreatePromptInput): Promise<Prompt> {
    const now = new Date().toISOString();
    const newPrompt: Prompt = {
      id: `prompt-${Date.now()}`,
      name: input.name,
      description: input.description,
      content: input.content,
      folder: input.folder || '',
      icon: input.icon || 'file-text',
      color: input.color || '#3B82F6',
      tags: input.tags || [],
      variables: input.variables || [],
      auto_paste: input.auto_paste ?? true,
      is_favorite: false,
      created_at: now,
      updated_at: now,
    };

    this.prompts.push(newPrompt);

    // Create initial version
    this.createVersion(newPrompt, 'Initial creation');

    console.log('[Mock] Created prompt:', newPrompt.name);
    return Promise.resolve({ ...newPrompt });
  }

  async updatePrompt(input: UpdatePromptInput): Promise<Prompt> {
    const index = this.prompts.findIndex(p => p.id === input.id);
    if (index === -1) {
      throw new Error(`Prompt not found: ${input.id}`);
    }

    const existing = this.prompts[index];
    const updated: Prompt = {
      ...existing,
      ...input,
      updated_at: new Date().toISOString(),
    };

    this.prompts[index] = updated;

    // Create version for significant changes
    if (input.content !== undefined && input.content !== existing.content) {
      this.createVersion(updated, 'Content updated');
    }

    console.log('[Mock] Updated prompt:', updated.name);
    return Promise.resolve({ ...updated });
  }

  async deletePrompt(id: string): Promise<void> {
    const index = this.prompts.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Prompt not found: ${id}`);
    }

    const prompt = this.prompts[index];
    this.prompts.splice(index, 1);
    this.versions.delete(id);
    this.usageStats.delete(id);

    console.log('[Mock] Deleted prompt:', prompt.name);
    return Promise.resolve();
  }

  async duplicatePrompt(id: string, newName?: string): Promise<Prompt> {
    const original = await this.getPrompt(id);
    const duplicate: CreatePromptInput = {
      name: newName || `${original.name} (Copy)`,
      description: original.description,
      content: original.content,
      folder: original.folder,
      icon: original.icon,
      color: original.color,
      tags: [...original.tags],
      variables: original.variables.map(v => ({ ...v })),
      auto_paste: original.auto_paste,
    };

    return this.createPrompt(duplicate);
  }

  // ---------------------------------------------------------------------------
  // SEARCH & FILTERING
  // ---------------------------------------------------------------------------

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

  async getPromptsByFolder(folder: string): Promise<Prompt[]> {
    return Promise.resolve(
      this.prompts.filter(p => p.folder === folder)
    );
  }

  async getPromptsByTag(tag: string): Promise<Prompt[]> {
    return Promise.resolve(
      this.prompts.filter(p => p.tags.includes(tag))
    );
  }

  async getFavoritePrompts(): Promise<Prompt[]> {
    return Promise.resolve(
      this.prompts.filter(p => p.is_favorite)
    );
  }

  // ---------------------------------------------------------------------------
  // ORGANIZATION
  // ---------------------------------------------------------------------------

  async getFolders(): Promise<PromptFolder[]> {
    // Update counts
    const counts = new Map<string, number>();
    for (const prompt of this.prompts) {
      if (prompt.folder) {
        counts.set(prompt.folder, (counts.get(prompt.folder) || 0) + 1);
      }
    }

    return Promise.resolve(
      this.folders.map(f => ({
        ...f,
        prompt_count: counts.get(f.id) || 0,
      }))
    );
  }

  async createFolder(name: string, parentId?: string): Promise<PromptFolder> {
    const folder: PromptFolder = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      parent_id: parentId,
      prompt_count: 0,
      created_at: new Date().toISOString(),
    };

    this.folders.push(folder);
    console.log('[Mock] Created folder:', folder.name);
    return Promise.resolve({ ...folder });
  }

  async deleteFolder(id: string): Promise<void> {
    const index = this.folders.findIndex(f => f.id === id);
    if (index === -1) {
      throw new Error(`Folder not found: ${id}`);
    }

    // Move prompts to root
    for (const prompt of this.prompts) {
      if (prompt.folder === id) {
        prompt.folder = '';
      }
    }

    this.folders.splice(index, 1);
    console.log('[Mock] Deleted folder:', id);
    return Promise.resolve();
  }

  async getTags(): Promise<PromptTag[]> {
    const tagCounts = new Map<string, number>();

    for (const prompt of this.prompts) {
      for (const tag of prompt.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    return Promise.resolve(
      Array.from(tagCounts.entries()).map(([name, count]) => ({
        name,
        prompt_count: count,
      }))
    );
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const prompt = this.prompts.find(p => p.id === id);
    if (!prompt) {
      throw new Error(`Prompt not found: ${id}`);
    }

    prompt.is_favorite = !prompt.is_favorite;
    console.log('[Mock] Toggle favorite:', prompt.name, prompt.is_favorite);
    return Promise.resolve(prompt.is_favorite);
  }

  // ---------------------------------------------------------------------------
  // VERSION HISTORY
  // ---------------------------------------------------------------------------

  async getVersionHistory(promptId: string): Promise<PromptVersion[]> {
    return Promise.resolve(
      this.versions.get(promptId) || []
    );
  }

  async restoreVersion(promptId: string, versionId: string): Promise<Prompt> {
    const versions = this.versions.get(promptId);
    if (!versions) {
      throw new Error(`No versions found for prompt: ${promptId}`);
    }

    const version = versions.find(v => v.id === versionId);
    if (!version) {
      throw new Error(`Version not found: ${versionId}`);
    }

    return this.updatePrompt({
      id: promptId,
      content: version.content,
      name: version.name,
      description: version.description,
    });
  }

  private createVersion(prompt: Prompt, changeSummary: string): void {
    const versions = this.versions.get(prompt.id) || [];
    const version: PromptVersion = {
      id: `version-${Date.now()}`,
      prompt_id: prompt.id,
      version_number: versions.length + 1,
      content: prompt.content,
      name: prompt.name,
      description: prompt.description,
      change_summary: changeSummary,
      created_at: new Date().toISOString(),
    };

    versions.unshift(version);
    this.versions.set(prompt.id, versions);
  }

  // ---------------------------------------------------------------------------
  // USAGE & ANALYTICS
  // ---------------------------------------------------------------------------

  async recordUsage(id: string): Promise<void> {
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const stats = this.usageStats.get(id) || {
      prompt_id: id,
      total_uses: 0,
      last_used: null,
      daily_uses: [],
      weekly_uses: [],
      monthly_uses: [],
    };

    stats.total_uses++;
    stats.last_used = now;

    // Update daily uses
    const existingDaily = stats.daily_uses.find(d => d.period === today);
    if (existingDaily) {
      existingDaily.count++;
    } else {
      stats.daily_uses.push({ period: today, count: 1 });
    }

    this.usageStats.set(id, stats);

    console.log('[Mock] Record usage:', id, stats.total_uses);
    return Promise.resolve();
  }

  async getUsageStats(id: string): Promise<UsageStats> {
    return Promise.resolve(
      this.usageStats.get(id) || {
        prompt_id: id,
        total_uses: 0,
        last_used: null,
        daily_uses: [],
        weekly_uses: [],
        monthly_uses: [],
      }
    );
  }

  // ---------------------------------------------------------------------------
  // CLIPBOARD & WINDOW
  // ---------------------------------------------------------------------------

  async copyAndPaste(text: string, auto_paste: boolean): Promise<CopyPasteResult> {
    console.log('[Mock] Copy and paste:', { text: text.substring(0, 50), auto_paste });
    return Promise.resolve({
      clipboard_success: true,
      paste_attempted: auto_paste,
      paste_likely_success: auto_paste,
      message: auto_paste ? 'Copied and pasted' : 'Copied to clipboard',
    });
  }

  async hideAndRestore(): Promise<void> {
    console.log('[Mock] Hide and restore');
    return Promise.resolve();
  }

  // ---------------------------------------------------------------------------
  // SETTINGS
  // ---------------------------------------------------------------------------

  async getConfig(): Promise<AppConfig> {
    return Promise.resolve({ ...this.config });
  }

  async updateConfig(config: Partial<AppConfig>): Promise<AppConfig> {
    this.config = { ...this.config, ...config };
    console.log('[Mock] Config updated:', config);
    return Promise.resolve({ ...this.config });
  }

  // ---------------------------------------------------------------------------
  // IMPORT/EXPORT
  // ---------------------------------------------------------------------------

  async exportPrompt(id: string): Promise<string> {
    const prompt = await this.getPrompt(id);
    const frontmatter = [
      '---',
      `name: "${prompt.name}"`,
      `description: "${prompt.description}"`,
      `folder: "${prompt.folder}"`,
      `icon: "${prompt.icon}"`,
      `color: "${prompt.color}"`,
      `tags: [${prompt.tags.map(t => `"${t}"`).join(', ')}]`,
      `auto_paste: ${prompt.auto_paste}`,
      `is_favorite: ${prompt.is_favorite}`,
      '---',
      '',
    ].join('\n');

    return Promise.resolve(frontmatter + prompt.content);
  }

  async importPrompt(content: string): Promise<Prompt> {
    // Simple frontmatter parsing
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      throw new Error('Invalid prompt format: missing frontmatter');
    }

    const [, frontmatter, promptContent] = frontmatterMatch;
    const lines = frontmatter.split('\n');

    const getValue = (key: string): string => {
      const line = lines.find(l => l.startsWith(`${key}:`));
      if (!line) return '';
      const value = line.substring(key.length + 1).trim();
      return value.replace(/^["']|["']$/g, '');
    };

    const input: CreatePromptInput = {
      name: getValue('name') || 'Imported Prompt',
      description: getValue('description'),
      content: promptContent.trim(),
      folder: getValue('folder'),
      icon: getValue('icon') || 'file-text',
      color: getValue('color') || '#3B82F6',
      auto_paste: getValue('auto_paste') === 'true',
    };

    return this.createPrompt(input);
  }

  // ---------------------------------------------------------------------------
  // WINDOW MANAGEMENT
  // ---------------------------------------------------------------------------

  async openEditorWindow(promptId?: string, mode?: 'create' | 'edit'): Promise<void> {
    console.log(`[Mock] Open editor window: promptId=${promptId}, mode=${mode}`);
    // In mock mode, we could open a new window or navigate
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.origin);
      url.pathname = '/editor';
      if (promptId) url.searchParams.set('promptId', promptId);
      if (mode) url.searchParams.set('mode', mode);
      window.open(url.toString(), '_blank', 'width=900,height=700');
    }
    return Promise.resolve();
  }

  async openSettingsWindow(): Promise<void> {
    console.log('[Mock] Open settings window');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.origin);
      url.pathname = '/settings';
      window.open(url.toString(), '_blank', 'width=600,height=500');
    }
    return Promise.resolve();
  }

  async openAnalyticsWindow(): Promise<void> {
    console.log('[Mock] Open analytics window');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.origin);
      url.pathname = '/analytics';
      window.open(url.toString(), '_blank', 'width=800,height=600');
    }
    return Promise.resolve();
  }

  async closeWindow(label: string): Promise<void> {
    console.log(`[Mock] Close window: ${label}`);
    return Promise.resolve();
  }

  // ---------------------------------------------------------------------------
  // AUTOSTART
  // ---------------------------------------------------------------------------

  private autostartEnabled = false;

  async enableAutostart(): Promise<void> {
    console.log('[Mock] Enable autostart');
    this.autostartEnabled = true;
    return Promise.resolve();
  }

  async disableAutostart(): Promise<void> {
    console.log('[Mock] Disable autostart');
    this.autostartEnabled = false;
    return Promise.resolve();
  }

  async isAutostartEnabled(): Promise<boolean> {
    console.log(`[Mock] Is autostart enabled: ${this.autostartEnabled}`);
    return Promise.resolve(this.autostartEnabled);
  }
}

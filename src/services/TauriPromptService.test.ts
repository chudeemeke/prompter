import { TauriPromptService } from './TauriPromptService';
import type { Prompt, SearchResult } from '../lib/types';

// Mock @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

const createMockPrompt = (id: string): Prompt => ({
  id,
  name: `Test Prompt ${id}`,
  description: 'Test description',
  content: 'Test content',
  folder: 'Test',
  icon: '📝',
  color: '#3B82F6',
  tags: ['test'],
  variables: [],
  auto_paste: true,
  is_favorite: false,
  created_at: '2025-11-30T10:00:00Z',
  updated_at: '2025-11-30T10:00:00Z',
});

describe('TauriPromptService', () => {
  let service: TauriPromptService;

  beforeEach(() => {
    service = new TauriPromptService();
    vi.clearAllMocks();
  });

  describe('getAllPrompts', () => {
    it('should call invoke with get_all_prompts command', async () => {
      const mockPrompts = [createMockPrompt('1'), createMockPrompt('2')];
      (invoke as any).mockResolvedValue(mockPrompts);

      const result = await service.getAllPrompts();

      expect(invoke).toHaveBeenCalledWith('get_all_prompts');
      expect(result).toEqual(mockPrompts);
    });

    it('should return empty array if backend returns empty', async () => {
      (invoke as any).mockResolvedValue([]);

      const result = await service.getAllPrompts();

      expect(result).toEqual([]);
    });

    it('should propagate errors from invoke', async () => {
      (invoke as any).mockRejectedValue(new Error('Tauri error'));

      await expect(service.getAllPrompts()).rejects.toThrow('Tauri error');
    });
  });

  describe('getPrompt', () => {
    it('should call invoke with get_prompt command and id', async () => {
      const mockPrompt = createMockPrompt('test-id');
      (invoke as any).mockResolvedValue(mockPrompt);

      const result = await service.getPrompt('test-id');

      expect(invoke).toHaveBeenCalledWith('get_prompt', { id: 'test-id' });
      expect(result).toEqual(mockPrompt);
    });

    it('should handle different ids', async () => {
      const mockPrompt = createMockPrompt('another-id');
      (invoke as any).mockResolvedValue(mockPrompt);

      await service.getPrompt('another-id');

      expect(invoke).toHaveBeenCalledWith('get_prompt', { id: 'another-id' });
    });

    it('should propagate errors for non-existent prompts', async () => {
      (invoke as any).mockRejectedValue(new Error('Prompt not found'));

      await expect(service.getPrompt('non-existent')).rejects.toThrow('Prompt not found');
    });
  });

  describe('searchPrompts', () => {
    it('should call invoke with search_prompts command and query', async () => {
      const mockResults: SearchResult[] = [
        {
          prompt: createMockPrompt('1'),
          score: 100,
          highlights: [],
        },
      ];
      (invoke as any).mockResolvedValue(mockResults);

      const result = await service.searchPrompts('test query');

      expect(invoke).toHaveBeenCalledWith('search_prompts', { query: 'test query' });
      expect(result).toEqual(mockResults);
    });

    it('should handle empty query', async () => {
      (invoke as any).mockResolvedValue([]);

      await service.searchPrompts('');

      expect(invoke).toHaveBeenCalledWith('search_prompts', { query: '' });
    });

    it('should return search results with scores', async () => {
      const mockResults: SearchResult[] = [
        {
          prompt: createMockPrompt('1'),
          score: 95,
          highlights: ['match'],
        },
      ];
      (invoke as any).mockResolvedValue(mockResults);

      const result = await service.searchPrompts('test');

      expect(result[0]).toHaveProperty('score');
      expect(result[0]).toHaveProperty('highlights');
    });

    it('should propagate search errors', async () => {
      (invoke as any).mockRejectedValue(new Error('Search failed'));

      await expect(service.searchPrompts('query')).rejects.toThrow('Search failed');
    });
  });

  describe('copyAndPaste', () => {
    it('should call invoke with copy_and_paste command', async () => {
      (invoke as any).mockResolvedValue(undefined);

      await service.copyAndPaste('test text', true);

      expect(invoke).toHaveBeenCalledWith('copy_and_paste', {
        text: 'test text',
        auto_paste: true,
      });
    });

    it('should handle auto_paste false', async () => {
      (invoke as any).mockResolvedValue(undefined);

      await service.copyAndPaste('content', false);

      expect(invoke).toHaveBeenCalledWith('copy_and_paste', {
        text: 'content',
        auto_paste: false,
      });
    });

    it('should handle empty text', async () => {
      (invoke as any).mockResolvedValue(undefined);

      await service.copyAndPaste('', true);

      expect(invoke).toHaveBeenCalledWith('copy_and_paste', {
        text: '',
        auto_paste: true,
      });
    });

    it('should propagate clipboard errors', async () => {
      (invoke as any).mockRejectedValue(new Error('Clipboard error'));

      await expect(service.copyAndPaste('text', true)).rejects.toThrow('Clipboard error');
    });
  });

  describe('hideAndRestore', () => {
    it('should call invoke with hide_window command', async () => {
      (invoke as any).mockResolvedValue(undefined);

      await service.hideAndRestore();

      expect(invoke).toHaveBeenCalledWith('hide_window');
    });

    it('should propagate window management errors', async () => {
      (invoke as any).mockRejectedValue(new Error('Window error'));

      await expect(service.hideAndRestore()).rejects.toThrow('Window error');
    });
  });

  describe('recordUsage', () => {
    it('should call invoke with record_usage command', async () => {
      (invoke as any).mockResolvedValue(undefined);

      await service.recordUsage('prompt-id');

      expect(invoke).toHaveBeenCalledWith('record_usage', { prompt_id: 'prompt-id' });
    });

    it('should handle different prompt ids', async () => {
      (invoke as any).mockResolvedValue(undefined);

      await service.recordUsage('another-id');

      expect(invoke).toHaveBeenCalledWith('record_usage', { prompt_id: 'another-id' });
    });

    it('should propagate usage recording errors', async () => {
      (invoke as any).mockRejectedValue(new Error('Record failed'));

      await expect(service.recordUsage('id')).rejects.toThrow('Record failed');
    });
  });

  describe('Integration', () => {
    it('should work with typical workflow', async () => {
      const mockPrompts = [createMockPrompt('1')];
      const mockSearchResults: SearchResult[] = [
        { prompt: mockPrompts[0], score: 100, highlights: [] },
      ];

      (invoke as any)
        .mockResolvedValueOnce(mockPrompts)  // getAllPrompts
        .mockResolvedValueOnce(mockSearchResults)  // searchPrompts
        .mockResolvedValueOnce(mockPrompts[0])  // getPrompt
        .mockResolvedValueOnce(undefined)  // recordUsage
        .mockResolvedValueOnce(undefined)  // copyAndPaste
        .mockResolvedValueOnce(undefined);  // hideAndRestore

      await service.getAllPrompts();
      await service.searchPrompts('test');
      await service.getPrompt('1');
      await service.recordUsage('1');
      await service.copyAndPaste('content', true);
      await service.hideAndRestore();

      expect(invoke).toHaveBeenCalledTimes(6);
    });
  });
});

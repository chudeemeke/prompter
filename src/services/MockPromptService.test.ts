import { MockPromptService } from './MockPromptService';

describe('MockPromptService', () => {
  let service: MockPromptService;

  beforeEach(() => {
    service = new MockPromptService();
    vi.clearAllMocks();
  });

  describe('getAllPrompts', () => {
    it('should return all prompts', async () => {
      const prompts = await service.getAllPrompts();

      expect(Array.isArray(prompts)).toBe(true);
      expect(prompts.length).toBeGreaterThan(0);
    });

    it('should return a copy of prompts array', async () => {
      const prompts1 = await service.getAllPrompts();
      const prompts2 = await service.getAllPrompts();

      expect(prompts1).not.toBe(prompts2);
      expect(prompts1).toEqual(prompts2);
    });

    it('should return prompts with required properties', async () => {
      const prompts = await service.getAllPrompts();
      const prompt = prompts[0];

      expect(prompt).toHaveProperty('id');
      expect(prompt).toHaveProperty('name');
      expect(prompt).toHaveProperty('content');
      expect(prompt).toHaveProperty('folder');
      expect(prompt).toHaveProperty('icon');
      expect(prompt).toHaveProperty('color');
    });
  });

  describe('getPrompt', () => {
    it('should return prompt by id', async () => {
      const prompts = await service.getAllPrompts();
      const targetPrompt = prompts[0];

      const result = await service.getPrompt(targetPrompt.id);

      expect(result).toEqual(targetPrompt);
    });

    it('should throw error for non-existent id', async () => {
      await expect(service.getPrompt('non-existent-id')).rejects.toThrow(
        'Prompt not found: non-existent-id'
      );
    });

    it('should handle empty string id', async () => {
      await expect(service.getPrompt('')).rejects.toThrow('Prompt not found: ');
    });
  });

  describe('searchPrompts', () => {
    it('should return all prompts for empty query', async () => {
      const results = await service.searchPrompts('');
      const allPrompts = await service.getAllPrompts();

      expect(results.length).toBe(allPrompts.length);
      results.forEach(result => {
        expect(result).toHaveProperty('prompt');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('highlights');
      });
    });

    it('should return all prompts for whitespace query', async () => {
      const results = await service.searchPrompts('   ');
      const allPrompts = await service.getAllPrompts();

      expect(results.length).toBe(allPrompts.length);
    });

    it('should filter prompts by name', async () => {
      const allPrompts = await service.getAllPrompts();
      const targetPrompt = allPrompts[0];

      const results = await service.searchPrompts(targetPrompt.name);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.prompt.id === targetPrompt.id)).toBe(true);
    });

    it('should be case insensitive', async () => {
      const allPrompts = await service.getAllPrompts();
      const targetPrompt = allPrompts[0];

      const lowerResults = await service.searchPrompts(targetPrompt.name.toLowerCase());
      const upperResults = await service.searchPrompts(targetPrompt.name.toUpperCase());

      expect(lowerResults.length).toBe(upperResults.length);
    });

    it('should search in description', async () => {
      const allPrompts = await service.getAllPrompts();
      const promptWithDesc = allPrompts.find(p => p.description);

      if (promptWithDesc && promptWithDesc.description) {
        const results = await service.searchPrompts(promptWithDesc.description);
        expect(results.some(r => r.prompt.id === promptWithDesc.id)).toBe(true);
      }
    });

    it('should search in tags', async () => {
      const allPrompts = await service.getAllPrompts();
      const promptWithTags = allPrompts.find(p => p.tags && p.tags.length > 0);

      if (promptWithTags && promptWithTags.tags) {
        const results = await service.searchPrompts(promptWithTags.tags[0]);
        expect(results.some(r => r.prompt.id === promptWithTags.id)).toBe(true);
      }
    });

    it('should search in content', async () => {
      const allPrompts = await service.getAllPrompts();
      const targetPrompt = allPrompts[0];
      const contentWord = targetPrompt.content.split(' ')[0];

      const results = await service.searchPrompts(contentWord);

      expect(results.some(r => r.prompt.id === targetPrompt.id)).toBe(true);
    });

    it('should assign higher score to name matches', async () => {
      const results = await service.searchPrompts('test');
      const nameMatches = results.filter(r => r.score === 100);
      const otherMatches = results.filter(r => r.score === 50);

      // At least some differentiation in scores
      expect(nameMatches.length + otherMatches.length).toBe(results.length);
    });

    it('should sort results by score descending', async () => {
      const results = await service.searchPrompts('test');

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('should return empty array for non-matching query', async () => {
      const results = await service.searchPrompts('xyznonexistentquery123');

      expect(results).toEqual([]);
    });

    it('should include empty highlights array', async () => {
      const results = await service.searchPrompts('test');

      results.forEach(result => {
        expect(Array.isArray(result.highlights)).toBe(true);
        expect(result.highlights).toEqual([]);
      });
    });
  });

  describe('copyAndPaste', () => {
    it('should resolve without error', async () => {
      await expect(service.copyAndPaste('test text', true)).resolves.toBeUndefined();
    });

    it('should handle auto_paste true', async () => {
      await expect(service.copyAndPaste('text', true)).resolves.toBeUndefined();
    });

    it('should handle auto_paste false', async () => {
      await expect(service.copyAndPaste('text', false)).resolves.toBeUndefined();
    });

    it('should handle empty text', async () => {
      await expect(service.copyAndPaste('', true)).resolves.toBeUndefined();
    });

    it('should handle long text', async () => {
      const longText = 'a'.repeat(10000);
      await expect(service.copyAndPaste(longText, true)).resolves.toBeUndefined();
    });
  });

  describe('hideAndRestore', () => {
    it('should resolve without error', async () => {
      await expect(service.hideAndRestore()).resolves.toBeUndefined();
    });

    it('should be callable multiple times', async () => {
      await service.hideAndRestore();
      await service.hideAndRestore();
      await expect(service.hideAndRestore()).resolves.toBeUndefined();
    });
  });

  describe('recordUsage', () => {
    it('should resolve without error', async () => {
      await expect(service.recordUsage('test-id')).resolves.toBeUndefined();
    });

    it('should accept any string id', async () => {
      await expect(service.recordUsage('any-id-123')).resolves.toBeUndefined();
    });

    it('should handle empty string', async () => {
      await expect(service.recordUsage('')).resolves.toBeUndefined();
    });

    it('should be callable multiple times', async () => {
      await service.recordUsage('id1');
      await service.recordUsage('id2');
      await expect(service.recordUsage('id3')).resolves.toBeUndefined();
    });
  });

  describe('Integration', () => {
    it('should work with typical workflow', async () => {
      // Get all prompts
      const prompts = await service.getAllPrompts();
      expect(prompts.length).toBeGreaterThan(0);

      // Search for a prompt
      const searchResults = await service.searchPrompts(prompts[0].name);
      expect(searchResults.length).toBeGreaterThan(0);

      // Get specific prompt
      const prompt = await service.getPrompt(prompts[0].id);
      expect(prompt).toBeDefined();

      // Record usage
      await service.recordUsage(prompt.id);

      // Copy and paste
      await service.copyAndPaste(prompt.content, prompt.auto_paste);

      // Hide window
      await service.hideAndRestore();
    });
  });
});

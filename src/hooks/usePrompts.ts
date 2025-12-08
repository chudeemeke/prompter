import { useState, useEffect, useCallback } from 'react';
import type { Prompt } from '../lib/types';
import type { PromptService } from '../services/PromptService';

/**
 * Hook for fetching and managing prompts
 * Depends on PromptService abstraction (not Tauri directly)
 */
export function usePrompts(service: PromptService) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[usePrompts] Loading prompts...');
      const data = await service.getAllPrompts();
      console.log('[usePrompts] Received prompts:', data.length, data);
      setPrompts(data);
      setError(null);
    } catch (err) {
      console.error('[usePrompts] Error loading prompts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  return { prompts, loading, error, reload: loadPrompts };
}

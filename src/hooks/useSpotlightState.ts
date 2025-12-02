import { useState, useCallback } from 'react';
import type { Prompt } from '../lib/types';
import type { PromptService } from '../services/PromptService';

/**
 * Centralized state management for Spotlight window
 * All business logic in one place
 */
export function useSpotlightState(service: PromptService) {
  const [query, setQuery] = useState('');
  const [selected_index, setSelectedIndex] = useState(0);
  const [showContextModal, setShowContextModal] = useState(false);
  const [selected_prompt, setSelectedPrompt] = useState<Prompt | null>(null);

  const selectPrompt = useCallback((prompt: Prompt) => {
    if (prompt.variables && prompt.variables.length > 0) {
      // Show context modal for variable input
      setSelectedPrompt(prompt);
      setShowContextModal(true);
    } else {
      // No variables, select directly
      handlePromptSelection(prompt, {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePromptSelection = useCallback(
    async (prompt: Prompt, variables: Record<string, string>) => {
      console.log('[useSpotlightState] handlePromptSelection called', { prompt_id: prompt.id, variables });

      try {
        // Substitute variables in content
        let content = prompt.content;
        Object.entries(variables).forEach(([key, value]) => {
          content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        });
        console.log('[useSpotlightState] Content after substitution:', content.substring(0, 100));

        // Record usage for frecency
        console.log('[useSpotlightState] Recording usage...');
        await service.recordUsage(prompt.id);
        console.log('[useSpotlightState] Usage recorded');

        // Copy and paste (fixed: use auto_paste instead of auto_paste)
        console.log('[useSpotlightState] Calling copyAndPaste...', { auto_paste: prompt.auto_paste });
        await service.copyAndPaste(content, prompt.auto_paste);
        console.log('[useSpotlightState] copyAndPaste completed');

        // Close modal
        setShowContextModal(false);
        setSelectedPrompt(null);
      } catch (error) {
        console.error('[useSpotlightState] Error in handlePromptSelection:', error);
        throw error;
      }
    },
    [service]
  );

  const closeWindow = useCallback(async () => {
    await service.hideAndRestore();
  }, [service]);

  const moveSelection = useCallback((direction: 'up' | 'down', maxIndex: number) => {
    setSelectedIndex(prev => {
      if (direction === 'up') {
        return prev > 0 ? prev - 1 : maxIndex;
      } else {
        return prev < maxIndex ? prev + 1 : 0;
      }
    });
  }, []);

  return {
    // State
    query,
    selected_index,
    showContextModal,
    selected_prompt,

    // Actions
    setQuery,
    setSelectedIndex,
    selectPrompt,
    handlePromptSelection,
    closeWindow,
    moveSelection,
    setShowContextModal,
  };
}

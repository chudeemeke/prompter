import { useState, useCallback } from 'react';
import type { Prompt } from '../lib/types';
import type { PromptService } from '../services/PromptService';
import { useToastContextSafe } from '../context';
import { loggers } from '../lib/logger';

const log = loggers.hooks.spotlightState;

/**
 * Centralized state management for Spotlight window
 * All business logic in one place
 */
export function useSpotlightState(service: PromptService) {
  const [query, setQuery] = useState('');
  const [selected_index, setSelectedIndex] = useState(0);
  const [showContextModal, setShowContextModal] = useState(false);
  const [selected_prompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const toast = useToastContextSafe();

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
      log.debug('handlePromptSelection called', { prompt_id: prompt.id, variables });

      try {
        // Substitute variables in content
        let content = prompt.content;
        Object.entries(variables).forEach(([key, value]) => {
          // Escape special regex characters in variable names to prevent regex injection
          const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          content = content.replace(new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g'), value);
        });
        log.debug('Content after substitution:', content.substring(0, 100));

        // Record usage for frecency
        log.debug('Recording usage...');
        await service.recordUsage(prompt.id);
        log.debug('Usage recorded');

        // Copy and paste
        log.debug('Calling copyAndPaste...', { auto_paste: prompt.auto_paste });
        const result = await service.copyAndPaste(content, prompt.auto_paste);
        log.debug('copyAndPaste completed', result);

        // Close modal
        setShowContextModal(false);
        setSelectedPrompt(null);

        // Show toast based on result
        if (!result.clipboard_success) {
          // Clipboard failed - show error
          toast?.error('Copy failed', result.message);
        } else if (result.paste_likely_success) {
          // Everything worked - show success
          toast?.success(result.message, `"${prompt.name}" is ready to use`);
        } else if (result.paste_attempted) {
          // Paste was tried but uncertain - show info with hint
          toast?.info(result.message, `"${prompt.name}" - press Ctrl+V if needed`);
        } else {
          // Auto-paste disabled - show success for copy
          toast?.success(result.message, `"${prompt.name}" is ready to use`);
        }
      } catch (error) {
        log.error('Error in handlePromptSelection:', error);

        // Show error toast
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast?.error('Failed to paste', errorMessage);

        // Close modal even on error so user can retry
        setShowContextModal(false);
        setSelectedPrompt(null);
      }
    },
    [service, toast]
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

import { useEffect } from 'react';
import { usePrompts } from '../../hooks/usePrompts';
import { useSearch } from '../../hooks/useSearch';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useSpotlightState } from '../../hooks/useSpotlightState';
import { useDebounce } from '../../hooks/useDebounce';
import type { PromptService } from '../../services/PromptService';
import { SearchInput } from './SearchInput';
import { ResultsList } from './ResultsList';
import { ContextModal } from './ContextModal';
import { ResultsListSkeleton } from '../shared/Skeleton';

interface SpotlightWindowProps {
  service: PromptService;
}

/**
 * Container component (smart component)
 * Manages state and business logic, delegates presentation to child components
 */
export function SpotlightWindow({ service }: SpotlightWindowProps) {
  const { prompts, loading, error } = usePrompts(service);
  const state = useSpotlightState(service);

  // Debounce search query to reduce re-renders during fast typing
  const debouncedQuery = useDebounce(state.query, 150);
  const filteredPrompts = useSearch(prompts, debouncedQuery);

  // Keyboard navigation - DISABLED when modal is open
  useKeyboard({
    enabled: !state.showContextModal,  // ← Disable when modal is open
    onArrowUp: () => state.moveSelection('up', filteredPrompts.length - 1),
    onArrowDown: () => state.moveSelection('down', filteredPrompts.length - 1),
    onEnter: () => {
      if (filteredPrompts[state.selected_index]) {
        state.selectPrompt(filteredPrompts[state.selected_index]);
      }
    },
    onEscape: () => state.closeWindow(),
    onTab: () => {
      if (filteredPrompts[state.selected_index]) {
        state.selectPrompt(filteredPrompts[state.selected_index]);
      }
    },
    onEdit: () => {
      // Ctrl+E to edit selected prompt
      if (filteredPrompts[state.selected_index]) {
        const selectedPrompt = filteredPrompts[state.selected_index];
        service.openEditorWindow(selectedPrompt.id, 'edit');
      }
    },
    onNew: () => {
      // Ctrl+N to create new prompt
      service.openEditorWindow(undefined, 'create');
    },
    onSettings: () => {
      // Ctrl+, to open settings
      service.openSettingsWindow();
    },
  });

  // Reset selected index when results change
  useEffect(() => {
    state.setSelectedIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPrompts.length]);

  if (loading) {
    return (
      <div className="spotlight-window" data-testid="spotlight-loading">
        <SearchInput value="" onChange={() => {}} placeholder="Loading..." />
        <ResultsListSkeleton count={5} />
        <div className="keyboard-hints">
          <span className="keyboard-hint">
            <kbd>↑↓</kbd> Navigate
          </span>
          <span className="keyboard-hint">
            <kbd>Enter</kbd> Select
          </span>
          <span className="keyboard-hint">
            <kbd>Esc</kbd> Close
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="spotlight-window" data-testid="spotlight-error">
        <SearchInput value="" onChange={() => {}} />
        <div className="empty-state">
          <div className="empty-state-title">Unable to load prompts</div>
          <div className="empty-state-description">{error}</div>
          <button
            type="button"
            className="empty-state-action"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="spotlight-window">
      <SearchInput value={state.query} onChange={state.setQuery} />
      <ResultsList
        results={filteredPrompts}
        selected_index={state.selected_index}
        onSelect={state.selectPrompt}
        onHover={state.setSelectedIndex}
        hasPrompts={prompts.length > 0}
        searchQuery={state.query}
      />
      <div className="keyboard-hints">
        <span className="keyboard-hint">
          <kbd>↑↓</kbd> Navigate
        </span>
        <span className="keyboard-hint">
          <kbd>Tab</kbd> Promote
        </span>
        <span className="keyboard-hint">
          <kbd>Enter</kbd> Paste
        </span>
        <span className="keyboard-hint">
          <kbd>Alt+E</kbd> Edit
        </span>
        <span className="keyboard-hint">
          <kbd>Alt+N</kbd> New
        </span>
        <span className="keyboard-hint">
          <kbd>Alt+,</kbd> Settings
        </span>
        <span className="keyboard-hint">
          <kbd>Esc</kbd> Dismiss
        </span>
        <img
          src="/icon.png"
          alt="Prompter"
          className="prompter-logo"
        />
      </div>

      {state.showContextModal && state.selected_prompt && (
        <ContextModal
          prompt={state.selected_prompt}
          onConfirm={(vars) => state.handlePromptSelection(state.selected_prompt!, vars)}
          onCancel={() => state.setShowContextModal(false)}
        />
      )}
    </div>
  );
}

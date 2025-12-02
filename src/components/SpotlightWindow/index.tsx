import { useEffect } from 'react';
import { usePrompts } from '../../hooks/usePrompts';
import { useSearch } from '../../hooks/useSearch';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useSpotlightState } from '../../hooks/useSpotlightState';
import type { PromptService } from '../../services/PromptService';
import { SearchInput } from './SearchInput';
import { ResultsList } from './ResultsList';
import { ContextModal } from './ContextModal';

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
  const filteredPrompts = useSearch(prompts, state.query);

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
  });

  // Reset selected index when results change
  useEffect(() => {
    state.setSelectedIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPrompts.length]);

  if (loading) {
    return (
      <div className="spotlight-window">
        <div className="loading">Loading prompts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="spotlight-window">
        <div className="error">Error: {error}</div>
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
      />
      <div className="keyboard-hints">
        <span className="keyboard-hint">
          <kbd>↑↓</kbd> Navigate
        </span>
        <span className="keyboard-hint">
          <kbd>Enter</kbd> Select
        </span>
        <span className="keyboard-hint">
          <kbd>Tab</kbd> Variables
        </span>
        <span className="keyboard-hint">
          <kbd>Esc</kbd> Close
        </span>
        <img
          src="/icon.png"
          alt="Prompter"
          className="prompter-logo"
          style={{ width: '20px', height: '20px', marginLeft: 'auto', opacity: 0.6 }}
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

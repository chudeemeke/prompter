import { memo, useMemo } from 'react';
import type { Prompt } from '../../lib/types';
import { DynamicIcon } from '../shared/IconPicker';

interface ResultItemProps {
  prompt: Prompt;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

/**
 * Display a single prompt result item.
 * Memoized to prevent unnecessary re-renders when prompt data hasn't changed.
 */
export const ResultItem = memo(function ResultItem({
  prompt,
  isSelected,
  onClick,
  onMouseEnter,
}: ResultItemProps) {
  // Memoize inline style to prevent object recreation on each render
  const iconStyle = useMemo(
    () => ({ backgroundColor: prompt.color || '#6B7280' }),
    [prompt.color]
  );

  return (
    <div
      className={`result-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      data-testid="result-item"
      data-selected={isSelected ? 'true' : 'false'}
      role="option"
      aria-selected={isSelected ? 'true' : 'false'}
    >
      <div className="result-icon" style={iconStyle}>
        <DynamicIcon icon={prompt.icon} size={20} />
      </div>
      <div className="result-content">
        <div className="result-name" data-testid="result-name">{prompt.name}</div>
        {prompt.description && (
          <div className="result-description">{prompt.description}</div>
        )}
      </div>
      {prompt.folder && (
        <div className="result-folder">{prompt.folder}</div>
      )}
      {prompt.variables && prompt.variables.length > 0 && (
        <div className="result-has-variables" title="Press Tab to fill variables">
          {'{{}}'}
        </div>
      )}
    </div>
  );
});

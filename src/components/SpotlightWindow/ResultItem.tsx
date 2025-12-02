import type { Prompt } from '../../lib/types';

interface ResultItemProps {
  prompt: Prompt;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

/**
 * Display a single prompt result item
 */
export function ResultItem({ prompt, isSelected, onClick, onMouseEnter }: ResultItemProps) {
  return (
    <div
      className={`result-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <div
        className="result-icon"
        style={{ backgroundColor: prompt.color || '#6B7280' }}
      >
        {prompt.icon}
      </div>
      <div className="result-content">
        <div className="result-name">{prompt.name}</div>
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
}

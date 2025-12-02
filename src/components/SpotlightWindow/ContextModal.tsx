import { useState, FormEvent, KeyboardEvent } from 'react';
import type { Prompt } from '../../lib/types';

interface ContextModalProps {
  prompt: Prompt;
  onConfirm: (variables: Record<string, string>) => void;
  onCancel: () => void;
}

/**
 * Modal for entering variable values for prompts with variables
 * Global keyboard handler is DISABLED when this modal is open
 */
export function ContextModal({ prompt, onConfirm, onCancel }: ContextModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    prompt.variables?.forEach(v => {
      initial[v.name] = v.default || '';
    });
    return initial;
  });

  const handleSubmit = (e: FormEvent) => {
    console.log('[ContextModal] handleSubmit called', { values });
    e.preventDefault();
    console.log('[ContextModal] Calling onConfirm...');
    onConfirm(values);
    console.log('[ContextModal] onConfirm completed');
  };

  // Handle Escape key to close modal
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="context-modal-overlay" onClick={onCancel}>
      <div
        className="context-modal"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h3>Fill in variables for "{prompt.name}"</h3>
        <form onSubmit={handleSubmit}>
          {prompt.variables?.map((variable, index) => (
            <div key={variable.name} className="variable-field">
              <label>
                {variable.name}
                {variable.required && <span className="required">*</span>}
              </label>
              <input
                type="text"
                value={values[variable.name] || ''}
                onChange={e => setValues(prev => ({
                  ...prev,
                  [variable.name]: e.target.value
                }))}
                placeholder={variable.default || `Enter ${variable.name}`}
                autoFocus={index === 0}
                required={variable.required}
              />
            </div>
          ))}
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="confirm-button">
              Use Prompt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

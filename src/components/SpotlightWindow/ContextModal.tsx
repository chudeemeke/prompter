import { useState, FormEvent, KeyboardEvent, useEffect } from 'react';
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
  console.log('[ContextModal] Component mounted for prompt:', prompt.name);

  useEffect(() => {
    console.log('[ContextModal] useEffect - modal is now visible');
    return () => {
      console.log('[ContextModal] useEffect cleanup - modal is being unmounted');
    };
  }, []);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    prompt.variables?.forEach(v => {
      initial[v.name] = v.default || '';
    });
    console.log('[ContextModal] Initial values:', initial);
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
    console.log('[ContextModal] handleKeyDown called, key:', e.key, 'target:', e.target);
    if (e.key === 'Escape') {
      console.log('[ContextModal] Escape pressed - closing modal');
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter') {
      console.log('[ContextModal] Enter pressed - should trigger form submission');
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

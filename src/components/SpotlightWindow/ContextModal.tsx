import { useState, FormEvent, KeyboardEvent, useEffect, useMemo, useRef } from 'react';
import type { Prompt } from '../../lib/types';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { loggers } from '../../lib/logger';

const log = loggers.contextModal;

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
  log.debug('Component mounted for prompt:', prompt.name);

  // Ref for focus trap
  const modalRef = useRef<HTMLDivElement>(null);

  // Apply focus trap to keep focus within modal
  useFocusTrap(modalRef, true);

  useEffect(() => {
    log.debug('Modal is now visible');
    return () => {
      log.debug('Modal is being unmounted');
    };
  }, []);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    prompt.variables?.forEach(v => {
      initial[v.name] = v.default || '';
    });
    log.debug('Initial values:', initial);
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate all required fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    prompt.variables?.forEach(variable => {
      if (variable.required && !values[variable.name]?.trim()) {
        newErrors[variable.name] = `${variable.name} is required`;
        isValid = false;
      }
    });

    setErrors(newErrors);
    // Mark all fields as touched on submit
    const allTouched: Record<string, boolean> = {};
    prompt.variables?.forEach(v => {
      allTouched[v.name] = true;
    });
    setTouched(allTouched);

    return isValid;
  };

  // Check if form is valid (for button state)
  const isFormValid = useMemo(() => {
    return prompt.variables?.every(
      v => !v.required || values[v.name]?.trim()
    ) ?? true;
  }, [prompt.variables, values]);

  const handleSubmit = (e: FormEvent) => {
    log.debug('handleSubmit called', { values });
    e.preventDefault();

    if (!validateForm()) {
      log.debug('Validation failed, not submitting');
      return;
    }

    log.debug('Calling onConfirm...');
    onConfirm(values);
    log.debug('onConfirm completed');
  };

  // Handle blur to show validation errors
  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    const variable = prompt.variables?.find(v => v.name === name);
    if (variable?.required && !values[name]?.trim()) {
      setErrors(prev => ({ ...prev, [name]: `${name} is required` }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle Escape key to close modal, Enter key to submit form
  const handleKeyDown = (e: KeyboardEvent) => {
    log.debug('handleKeyDown called, key:', e.key);

    // CRITICAL: Stop propagation to prevent global handlers from intercepting
    e.stopPropagation();

    if (e.key === 'Escape') {
      log.debug('Escape pressed - closing modal');
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter') {
      log.debug('Enter pressed - validating and submitting form');
      e.preventDefault();

      if (!validateForm()) {
        log.debug('Validation failed, not submitting');
        return;
      }

      // Submit the form directly by calling onConfirm with current values
      log.debug('Calling onConfirm with values:', values);
      onConfirm(values);
    }
  };

  return (
    <div
      className="context-modal-overlay"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
      data-testid="context-modal-overlay"
    >
      <div
        ref={modalRef}
        className="context-modal"
        onClick={e => e.stopPropagation()}
        data-testid="context-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="context-modal-title"
      >
        <h3 id="context-modal-title">Fill in variables for "{prompt.name}"</h3>
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          {prompt.variables?.map((variable, index) => {
            const hasError = touched[variable.name] && errors[variable.name];
            return (
              <div key={variable.name} className={`variable-field ${hasError ? 'has-error' : ''}`}>
                <label>
                  {variable.name}
                  {variable.required && <span className="required">*</span>}
                </label>
                <input
                  type="text"
                  name={variable.name}
                  value={values[variable.name] || ''}
                  onChange={e => {
                    setValues(prev => ({
                      ...prev,
                      [variable.name]: e.target.value
                    }));
                    // Clear error on change if field becomes valid
                    if (e.target.value.trim()) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[variable.name];
                        return newErrors;
                      });
                    }
                  }}
                  onBlur={() => handleBlur(variable.name)}
                  placeholder={variable.default || `Enter ${variable.name}`}
                  autoFocus={index === 0}
                  aria-invalid={!!hasError}
                  aria-describedby={hasError ? `${variable.name}-error` : undefined}
                />
                {hasError && (
                  <span
                    id={`${variable.name}-error`}
                    className="error-message"
                    role="alert"
                  >
                    {errors[variable.name]}
                  </span>
                )}
              </div>
            );
          })}
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="cancel-button">
              Cancel
            </button>
            <button
              type="submit"
              className="confirm-button"
              disabled={!isFormValid}
            >
              Use Prompt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

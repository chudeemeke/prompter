import { useState, useCallback, useEffect } from 'react';
import type { Prompt, PromptVariable, EditorMode, ValidationError } from '../lib/types';
import type { PromptService, CreatePromptInput, UpdatePromptInput } from '../services/PromptService';

// =============================================================================
// EDITOR STATE INTERFACE
// =============================================================================

export interface EditorState {
  mode: EditorMode;
  prompt: Prompt | null;
  draft: PromptDraft;
  isDirty: boolean;
  isSaving: boolean;
  errors: ValidationError[];
  activeTab: 'content' | 'variables' | 'metadata';
}

export interface PromptDraft {
  name: string;
  description: string;
  content: string;
  folder: string;
  icon: string;
  color: string;
  tags: string[];
  variables: PromptVariable[];
  auto_paste: boolean;
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const DEFAULT_DRAFT: PromptDraft = {
  name: '',
  description: '',
  content: '',
  folder: '',
  icon: 'file-text',
  color: '#3B82F6',
  tags: [],
  variables: [],
  auto_paste: true,
};

// =============================================================================
// HOOK: useEditor
// =============================================================================

interface UseEditorOptions {
  service: PromptService;
  promptId?: string;
  mode?: EditorMode;
  onSave?: (prompt: Prompt) => void;
  onClose?: () => void;
}

export function useEditor({
  service,
  promptId,
  mode: initialMode = 'create',
  onSave,
  onClose,
}: UseEditorOptions) {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [mode, setMode] = useState<EditorMode>(initialMode);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [draft, setDraft] = useState<PromptDraft>(DEFAULT_DRAFT);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'variables' | 'metadata'>('content');
  const [isLoading, setIsLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // SYNC MODE WITH PROPS
  // ---------------------------------------------------------------------------

  // When promptId changes, update mode accordingly
  useEffect(() => {
    if (promptId) {
      setMode('edit');
    } else {
      setMode('create');
      setPrompt(null);
      setDraft(DEFAULT_DRAFT);
      setIsDirty(false);
      setErrors([]);
    }
  }, [promptId]);

  // ---------------------------------------------------------------------------
  // LOAD PROMPT
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (promptId) {
      setIsLoading(true);
      service.getPrompt(promptId)
        .then((p) => {
          setPrompt(p);
          setDraft({
            name: p.name,
            description: p.description,
            content: p.content,
            folder: p.folder,
            icon: p.icon,
            color: p.color,
            tags: [...p.tags],
            variables: p.variables.map(v => ({ ...v })),
            auto_paste: p.auto_paste,
          });
          setIsDirty(false);
        })
        .catch((e) => {
          console.error('[useEditor] Failed to load prompt:', e);
          // Tauri errors may be strings or objects with different structures
          const errorMessage = typeof e === 'string' ? e : (e?.message || e?.toString() || 'Unknown error');
          setErrors([{ field: 'general', message: `Failed to load prompt: ${errorMessage}` }]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [promptId, service]);

  // ---------------------------------------------------------------------------
  // VALIDATION
  // ---------------------------------------------------------------------------

  const validate = useCallback((): ValidationError[] => {
    const errs: ValidationError[] = [];

    if (!draft.name.trim()) {
      errs.push({ field: 'name', message: 'Name is required' });
    } else if (draft.name.length > 100) {
      errs.push({ field: 'name', message: 'Name must be 100 characters or less' });
    }

    if (!draft.content.trim()) {
      errs.push({ field: 'content', message: 'Content is required' });
    }

    // Validate variables
    const varNames = new Set<string>();
    for (const v of draft.variables) {
      if (!v.name.trim()) {
        errs.push({ field: 'variables', message: 'Variable name is required' });
      } else if (varNames.has(v.name)) {
        errs.push({ field: 'variables', message: `Duplicate variable name: ${v.name}` });
      } else {
        varNames.add(v.name);
      }

      if (v.validation_regex) {
        try {
          new RegExp(v.validation_regex);
        } catch {
          errs.push({ field: 'variables', message: `Invalid regex for ${v.name}` });
        }
      }
    }

    return errs;
  }, [draft]);

  // ---------------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------------

  const updateDraft = useCallback((updates: Partial<PromptDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
    setErrors([]);
  }, []);

  const updateField = useCallback(<K extends keyof PromptDraft>(
    field: K,
    value: PromptDraft[K]
  ) => {
    updateDraft({ [field]: value } as Partial<PromptDraft>);
  }, [updateDraft]);

  const save = useCallback(async () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return false;
    }

    setIsSaving(true);
    setErrors([]);

    try {
      let savedPrompt: Prompt;

      if (mode === 'create') {
        const input: CreatePromptInput = {
          name: draft.name.trim(),
          description: draft.description.trim(),
          content: draft.content,
          folder: draft.folder,
          icon: draft.icon,
          color: draft.color,
          tags: draft.tags,
          variables: draft.variables,
          auto_paste: draft.auto_paste,
        };
        savedPrompt = await service.createPrompt(input);
      } else {
        if (!prompt) throw new Error('No prompt to update');
        const input: UpdatePromptInput = {
          id: prompt.id,
          name: draft.name.trim(),
          description: draft.description.trim(),
          content: draft.content,
          folder: draft.folder,
          icon: draft.icon,
          color: draft.color,
          tags: draft.tags,
          variables: draft.variables,
          auto_paste: draft.auto_paste,
        };
        savedPrompt = await service.updatePrompt(input);
      }

      setPrompt(savedPrompt);
      setIsDirty(false);
      setMode('edit');
      onSave?.(savedPrompt);
      return true;
    } catch (e) {
      console.error('[useEditor] Save failed:', e);
      setErrors([{ field: 'general', message: `Save failed: ${(e as Error).message}` }]);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [mode, draft, prompt, service, validate, onSave]);

  const discard = useCallback(() => {
    if (prompt) {
      setDraft({
        name: prompt.name,
        description: prompt.description,
        content: prompt.content,
        folder: prompt.folder,
        icon: prompt.icon,
        color: prompt.color,
        tags: [...prompt.tags],
        variables: prompt.variables.map(v => ({ ...v })),
        auto_paste: prompt.auto_paste,
      });
    } else {
      setDraft(DEFAULT_DRAFT);
    }
    setIsDirty(false);
    setErrors([]);
  }, [prompt]);

  const close = useCallback(() => {
    if (isDirty) {
      // Caller should handle confirmation
      return false;
    }
    onClose?.();
    return true;
  }, [isDirty, onClose]);

  // ---------------------------------------------------------------------------
  // VARIABLE HELPERS
  // ---------------------------------------------------------------------------

  const addVariable = useCallback(() => {
    updateDraft({
      variables: [
        ...draft.variables,
        { name: '', default: '', required: false },
      ],
    });
  }, [draft.variables, updateDraft]);

  const updateVariable = useCallback((index: number, updates: Partial<PromptVariable>) => {
    const newVars = [...draft.variables];
    newVars[index] = { ...newVars[index], ...updates };
    updateDraft({ variables: newVars });
  }, [draft.variables, updateDraft]);

  const removeVariable = useCallback((index: number) => {
    updateDraft({
      variables: draft.variables.filter((_, i) => i !== index),
    });
  }, [draft.variables, updateDraft]);

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------

  return {
    // State
    mode,
    prompt,
    draft,
    isDirty,
    isSaving,
    isLoading,
    errors,
    activeTab,

    // Actions
    setMode,
    setActiveTab,
    updateDraft,
    updateField,
    save,
    discard,
    close,

    // Variable helpers
    addVariable,
    updateVariable,
    removeVariable,

    // Computed
    hasErrors: errors.length > 0,
    canSave: isDirty && !isSaving,
    getFieldError: (field: string) => errors.find(e => e.field === field)?.message,
  };
}

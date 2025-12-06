import { useState, useCallback, useEffect } from 'react';
import {
  Save, X, Plus, Trash2, Copy,
  FileText, Tag, Settings2, History
} from 'lucide-react';
import { useEditor, PromptDraft } from '../../hooks/useEditor';
import type { PromptService } from '../../services/PromptService';
import type { EditorMode, PromptFolder, PromptVersion } from '../../lib/types';
import {
  Button, Input, Textarea, Select, TagInput,
  IconPicker, ColorPicker, Tabs, TabPanel,
  ConfirmDialog, ToastContainer, useToasts,
} from '../shared';
import { PromptSidebar } from './PromptSidebar';

// =============================================================================
// TYPES
// =============================================================================

interface EditorWindowProps {
  service: PromptService;
  promptId?: string;
  mode?: EditorMode;
  onClose?: () => void;
  onSave?: () => void;
  showSidebar?: boolean;
}

// =============================================================================
// COMPONENT: EditorWindow
// =============================================================================

export function EditorWindow({
  service,
  promptId: initialPromptId,
  mode: initialMode = 'create',
  onClose,
  onSave,
  showSidebar = true,
}: EditorWindowProps) {
  // ---------------------------------------------------------------------------
  // STATE & HOOKS
  // ---------------------------------------------------------------------------

  const toast = useToasts();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [folders, setFolders] = useState<PromptFolder[]>([]);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | undefined>(initialPromptId);
  const [currentMode, setCurrentMode] = useState<EditorMode>(initialPromptId ? 'edit' : initialMode);

  const editor = useEditor({
    service,
    promptId: selectedPromptId,
    mode: currentMode,
    onSave: (prompt) => {
      toast.success('Saved', `"${prompt.name}" saved successfully`);
      setSelectedPromptId(prompt.id);
      setCurrentMode('edit');
      onSave?.();
    },
    onClose,
  });

  // Handle sidebar prompt selection
  const handleSelectPrompt = useCallback((promptId: string) => {
    if (editor.isDirty) {
      // Prompt user to save changes first
      setShowDiscardDialog(true);
      return;
    }
    setSelectedPromptId(promptId);
    setCurrentMode('edit');
    setVersions([]); // Reset versions for new prompt
  }, [editor.isDirty]);

  // Handle new prompt creation from sidebar
  const handleNewPrompt = useCallback(() => {
    if (editor.isDirty) {
      setShowDiscardDialog(true);
      return;
    }
    setSelectedPromptId(undefined);
    setCurrentMode('create');
    setVersions([]);
  }, [editor.isDirty]);

  // Load folders
  useEffect(() => {
    service.getFolders()
      .then(setFolders)
      .catch(e => console.error('[EditorWindow] Failed to load folders:', e));
  }, [service]);

  // Load versions when viewing history tab
  useEffect(() => {
    if (editor.activeTab === 'metadata' && selectedPromptId && versions.length === 0) {
      setLoadingVersions(true);
      service.getVersionHistory(selectedPromptId)
        .then(setVersions)
        .catch(e => console.error('[EditorWindow] Failed to load versions:', e))
        .finally(() => setLoadingVersions(false));
    }
  }, [editor.activeTab, selectedPromptId, service, versions.length]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleClose = useCallback(() => {
    if (editor.isDirty) {
      setShowDiscardDialog(true);
    } else {
      onClose?.();
    }
  }, [editor.isDirty, onClose]);

  const handleSave = useCallback(async () => {
    const success = await editor.save();
    if (!success && editor.hasErrors) {
      toast.error('Validation Error', editor.errors[0]?.message || 'Please fix the errors');
    }
  }, [editor, toast]);

  const handleDuplicate = useCallback(async () => {
    if (!selectedPromptId) return;
    try {
      const duplicate = await service.duplicatePrompt(selectedPromptId);
      toast.success('Duplicated', `Created "${duplicate.name}"`);
    } catch (e) {
      toast.error('Failed', (e as Error).message);
    }
  }, [selectedPromptId, service, toast]);

  const handleRestoreVersion = useCallback(async (versionId: string) => {
    if (!selectedPromptId) return;
    try {
      await service.restoreVersion(selectedPromptId, versionId);
      toast.success('Restored', 'Version restored successfully');
      // Reload the prompt
      window.location.reload();
    } catch (e) {
      toast.error('Failed', (e as Error).message);
    }
  }, [selectedPromptId, service, toast]);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  const folderOptions = [
    { value: '', label: 'No folder' },
    ...folders.map(f => ({ value: f.id, label: f.name })),
  ];

  const tabs = [
    { id: 'content', label: 'Content', icon: <FileText size={16} /> },
    { id: 'variables', label: 'Variables', icon: <Tag size={16} /> },
    { id: 'metadata', label: 'Settings', icon: <Settings2 size={16} /> },
  ];

  return (
    <div className="editor-window">
      {/* Sidebar */}
      {showSidebar && (
        <PromptSidebar
          service={service}
          selectedPromptId={selectedPromptId}
          onSelectPrompt={handleSelectPrompt}
          onNewPrompt={handleNewPrompt}
        />
      )}

      {/* Main Editor Area */}
      <div className="editor-main">
        {/* Header */}
        <header className="editor-header">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: editor.draft.color }}
          >
            <FileText className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">
              {editor.mode === 'create' ? 'New Prompt' : editor.draft.name || 'Edit Prompt'}
            </h1>
            <p className="text-sm text-gray-400">
              {editor.mode === 'create'
                ? 'Create a new prompt template'
                : editor.isDirty
                  ? 'Unsaved changes'
                  : 'All changes saved'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedPromptId && (
            <Button variant="ghost" size="sm" onClick={handleDuplicate} icon={<Copy size={16} />}>
              Duplicate
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            icon={<X size={16} />}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={editor.isSaving}
            disabled={!editor.canSave}
            icon={<Save size={16} />}
          >
            Save
          </Button>
        </div>
      </header>

      {/* Error Banner */}
      {editor.hasErrors && editor.getFieldError('general') && (
        <div className="px-6 py-3 bg-red-900/30 border-b border-red-700/50">
          <p className="text-sm text-red-300">{editor.getFieldError('general')}</p>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        defaultTab="content"
        onChange={(id) => editor.setActiveTab(id as 'content' | 'variables' | 'metadata')}
        className="flex-1"
      >
        {/* Content Tab */}
        <TabPanel id="content" className="space-y-4">
          <Input
            label="Name"
            value={editor.draft.name}
            onChange={(e) => editor.updateField('name', e.target.value)}
            placeholder="Enter prompt name"
            error={editor.getFieldError('name')}
            required
          />

          <Input
            label="Description"
            value={editor.draft.description}
            onChange={(e) => editor.updateField('description', e.target.value)}
            placeholder="Brief description of what this prompt does"
          />

          <Textarea
            label="Prompt Content"
            value={editor.draft.content}
            onChange={(e) => editor.updateField('content', e.target.value)}
            placeholder="Enter your prompt template here...

Use {{variable_name}} for dynamic values."
            error={editor.getFieldError('content')}
            required
            rows={12}
          />

          <p className="text-xs text-gray-500">
            Tip: Use {'{{variable_name}}'} syntax for placeholders that will be filled when using the prompt.
          </p>
        </TabPanel>

        {/* Variables Tab */}
        <TabPanel id="variables" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-200">Variables</h3>
              <p className="text-xs text-gray-500 mt-1">
                Define variables that will be filled in when using this prompt
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={editor.addVariable}
              icon={<Plus size={16} />}
            >
              Add Variable
            </Button>
          </div>

          {editor.draft.variables.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Tag className="mx-auto mb-2 opacity-50" size={32} />
              <p>No variables defined</p>
              <p className="text-sm">Add variables to make your prompt dynamic</p>
            </div>
          ) : (
            <div className="space-y-3">
              {editor.draft.variables.map((variable, index) => (
                <VariableEditor
                  key={index}
                  variable={variable}
                  onChange={(updates) => editor.updateVariable(index, updates)}
                  onRemove={() => editor.removeVariable(index)}
                />
              ))}
            </div>
          )}

          {editor.getFieldError('variables') && (
            <p className="text-sm text-red-400">{editor.getFieldError('variables')}</p>
          )}
        </TabPanel>

        {/* Metadata Tab */}
        <TabPanel id="metadata" className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Folder"
              value={editor.draft.folder}
              onChange={(e) => editor.updateField('folder', e.target.value)}
              options={folderOptions}
            />

            <div className="flex gap-4">
              <IconPicker
                label="Icon"
                value={editor.draft.icon}
                onChange={(icon) => editor.updateField('icon', icon)}
              />
              <ColorPicker
                label="Color"
                value={editor.draft.color}
                onChange={(color) => editor.updateField('color', color)}
              />
            </div>
          </div>

          <TagInput
            label="Tags"
            value={editor.draft.tags}
            onChange={(tags) => editor.updateField('tags', tags)}
            placeholder="Add tags..."
            helperText="Press Enter or comma to add a tag"
          />

          <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
            <input
              type="checkbox"
              id="auto-paste"
              checked={editor.draft.auto_paste}
              onChange={(e) => editor.updateField('auto_paste', e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <label htmlFor="auto-paste" className="text-sm font-medium text-gray-200 cursor-pointer">
                Auto-paste
              </label>
              <p className="text-xs text-gray-500">
                Automatically paste the prompt when selected
              </p>
            </div>
          </div>

          {/* Version History */}
          {selectedPromptId && (
            <div className="pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <History size={16} className="text-gray-400" />
                <h3 className="text-sm font-medium text-gray-200">Version History</h3>
              </div>

              {loadingVersions ? (
                <p className="text-sm text-gray-500">Loading versions...</p>
              ) : versions.length === 0 ? (
                <p className="text-sm text-gray-500">No version history available</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-2 bg-gray-800/50 rounded"
                    >
                      <div>
                        <p className="text-sm text-gray-200">Version {version.version_number}</p>
                        <p className="text-xs text-gray-500">
                          {version.change_summary || 'No description'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreVersion(version.id)}
                      >
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabPanel>
      </Tabs>
      </div>

      {/* Discard Dialog */}
      <ConfirmDialog
        isOpen={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        onConfirm={() => {
          setShowDiscardDialog(false);
          onClose?.();
        }}
        title="Discard changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmText="Discard"
        variant="danger"
      />

      {/* Toasts */}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
    </div>
  );
}

// =============================================================================
// COMPONENT: VariableEditor
// =============================================================================

interface VariableEditorProps {
  variable: PromptDraft['variables'][number];
  onChange: (updates: Partial<PromptDraft['variables'][number]>) => void;
  onRemove: () => void;
}

function VariableEditor({ variable, onChange, onRemove }: VariableEditorProps) {
  return (
    <div className="p-4 bg-gray-800/50 rounded-lg space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 grid grid-cols-2 gap-3">
          <Input
            label="Variable Name"
            value={variable.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g., language"
            required
          />
          <Input
            label="Default Value"
            value={variable.default}
            onChange={(e) => onChange({ default: e.target.value })}
            placeholder="Optional default"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mt-6 p-2 text-gray-400 hover:text-red-400 transition-colors"
          aria-label="Remove variable"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={variable.required}
            onChange={(e) => onChange({ required: e.target.checked })}
            className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          Required
        </label>

        <Input
          value={variable.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Description (optional)"
          className="flex-1"
        />
      </div>
    </div>
  );
}

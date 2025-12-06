import { useState, useEffect, useCallback } from 'react';
import {
  Save, X, Keyboard, Palette, FolderOpen,
  Monitor, Shield, RotateCcw
} from 'lucide-react';
import type { PromptService } from '../../services/PromptService';
import type { AppConfig, Theme } from '../../lib/types';
import { useTheme } from '../../context';
import {
  Button, Input, Select, Tabs, TabPanel,
  ToastContainer, useToasts,
} from '../shared';

// =============================================================================
// TYPES
// =============================================================================

interface SettingsWindowProps {
  service: PromptService;
  onClose?: () => void;
}

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

const DEFAULT_CONFIG: AppConfig = {
  hotkey: 'F9',
  prompts_dir: '~/.prompter/prompts',
  theme: 'dark',
  language: 'en',
  auto_paste: true,
  close_after_paste: true,
  remember_last_query: false,
  auto_start: false,
  show_in_tray: true,
  max_results: 10,
  max_recent_prompts: 5,
  show_keyboard_hints: true,
  external_editor: {
    enabled: false,
    app: '',
    args: [],
  },
  editor_font_size: 14,
  editor_word_wrap: true,
  ui: {
    show_preview_pane: true,
    show_sidebar: true,
    window_width: 700,
    window_height: 500,
    sidebar_width: 200,
    preview_position: 'right',
  },
  backup_enabled: true,
  backup_interval_hours: 24,
  analytics_enabled: true,
};

// =============================================================================
// COMPONENT: SettingsWindow
// =============================================================================

export function SettingsWindow({ service, onClose }: SettingsWindowProps) {
  const toast = useToasts();
  const { setTheme } = useTheme();
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [autostartEnabled, setAutostartEnabled] = useState(false);

  // Load config and autostart status on mount
  useEffect(() => {
    Promise.all([
      service.getConfig(),
      service.isAutostartEnabled(),
    ])
      .then(([loaded, autostart]) => {
        setConfig({ ...DEFAULT_CONFIG, ...loaded });
        setAutostartEnabled(autostart);
        setLoading(false);
      })
      .catch((e) => {
        console.error('[SettingsWindow] Failed to load config:', e);
        setLoading(false);
      });
  }, [service]);

  // Handle theme change - apply immediately
  const handleThemeChange = useCallback(async (newTheme: Theme) => {
    setConfig((prev) => ({ ...prev, theme: newTheme }));
    setIsDirty(true);
    // Apply theme immediately for instant feedback
    await setTheme(newTheme);
  }, [setTheme]);

  // Handle autostart toggle
  const handleAutostartToggle = useCallback(async (enabled: boolean) => {
    try {
      if (enabled) {
        await service.enableAutostart();
      } else {
        await service.disableAutostart();
      }
      setAutostartEnabled(enabled);
      toast.success('Updated', enabled ? 'Autostart enabled' : 'Autostart disabled');
    } catch (e) {
      toast.error('Error', (e as Error).message);
    }
  }, [service, toast]);

  // Update a config field
  const updateConfig = useCallback(<K extends keyof AppConfig>(
    key: K,
    value: AppConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  // Save config
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await service.updateConfig(config);
      toast.success('Saved', 'Settings saved successfully');
      setIsDirty(false);
    } catch (e) {
      toast.error('Error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [service, config, toast]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setIsDirty(true);
  }, []);

  // Close handler
  const handleClose = useCallback(() => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Discard them?')) {
        onClose?.();
      }
    } else {
      onClose?.();
    }
  }, [isDirty, onClose]);

  const sections: SettingsSection[] = [
    { id: 'general', label: 'General', icon: <Monitor size={18} /> },
    { id: 'hotkeys', label: 'Hotkeys', icon: <Keyboard size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'storage', label: 'Storage', icon: <FolderOpen size={18} /> },
    { id: 'advanced', label: 'Advanced', icon: <Shield size={18} /> },
  ];

  if (loading) {
    return (
      <div className="settings-window flex items-center justify-center h-screen">
        <p className="settings-description">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-window h-screen">
      {/* Header */}
      <header>
        <h1>Settings</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            icon={<RotateCcw size={16} />}
          >
            Reset
          </Button>
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
            loading={saving}
            disabled={!isDirty}
            icon={<Save size={16} />}
          >
            Save
          </Button>
        </div>
      </header>

      {/* Content */}
      <Tabs
        tabs={sections.map((s) => ({ id: s.id, label: s.label, icon: s.icon }))}
        defaultTab="general"
        className="flex-1 overflow-hidden"
      >
        {/* General Tab */}
        <TabPanel id="general" className="space-y-6">
          <SettingsGroup title="Behavior">
            <SettingsToggle
              label="Auto-paste by default"
              description="Automatically paste prompts when selected"
              checked={config.auto_paste}
              onChange={(v) => updateConfig('auto_paste', v)}
            />
            <SettingsToggle
              label="Close window after paste"
              description="Hide the spotlight window after pasting"
              checked={config.close_after_paste}
              onChange={(v) => updateConfig('close_after_paste', v)}
            />
            <SettingsToggle
              label="Remember last query"
              description="Keep the search query when reopening"
              checked={config.remember_last_query}
              onChange={(v) => updateConfig('remember_last_query', v)}
            />
          </SettingsGroup>

          <SettingsGroup title="Startup">
            <SettingsToggle
              label="Start with Windows"
              description="Launch Prompter when Windows starts"
              checked={autostartEnabled}
              onChange={handleAutostartToggle}
            />
            <SettingsToggle
              label="Show in system tray"
              description="Display icon in the system tray"
              checked={config.show_in_tray}
              onChange={(v) => updateConfig('show_in_tray', v)}
            />
          </SettingsGroup>

          <SettingsGroup title="Display">
            <SettingsNumber
              label="Max search results"
              description="Number of results to show"
              value={config.max_results}
              onChange={(v) => updateConfig('max_results', v)}
              min={5}
              max={50}
            />
            <SettingsToggle
              label="Show keyboard hints"
              description="Display keyboard shortcuts in the UI"
              checked={config.show_keyboard_hints}
              onChange={(v) => updateConfig('show_keyboard_hints', v)}
            />
          </SettingsGroup>
        </TabPanel>

        {/* Hotkeys Tab */}
        <TabPanel id="hotkeys" className="space-y-6">
          <SettingsGroup title="Global Hotkey">
            <div className="space-y-2">
              <label className="settings-label">
                Activation hotkey
              </label>
              <Select
                value={config.hotkey}
                onChange={(e) => updateConfig('hotkey', e.target.value)}
                options={[
                  { value: 'F9', label: 'F9' },
                  { value: 'F10', label: 'F10' },
                  { value: 'F11', label: 'F11' },
                  { value: 'F12', label: 'F12' },
                  { value: 'Ctrl+Space', label: 'Ctrl + Space' },
                  { value: 'Ctrl+Shift+Space', label: 'Ctrl + Shift + Space' },
                  { value: 'Alt+Space', label: 'Alt + Space' },
                ]}
              />
              <p className="settings-description">
                Press this key to show Prompter from anywhere
              </p>
            </div>
          </SettingsGroup>

          <SettingsGroup title="Application Shortcuts">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between settings-label">
                <span>Search / Filter</span>
                <kbd className="settings-kbd">Just type</kbd>
              </div>
              <div className="flex justify-between settings-label">
                <span>Navigate results</span>
                <span>
                  <kbd className="settings-kbd">Up</kbd>
                  {' / '}
                  <kbd className="settings-kbd">Down</kbd>
                </span>
              </div>
              <div className="flex justify-between settings-label">
                <span>Select / Paste prompt</span>
                <kbd className="settings-kbd">Enter</kbd>
              </div>
              <div className="flex justify-between settings-label">
                <span>Promote selection</span>
                <kbd className="settings-kbd">Tab</kbd>
              </div>
              <div className="flex justify-between settings-label">
                <span>Edit selected prompt</span>
                <span>
                  <kbd className="settings-kbd">Alt</kbd>
                  {' + '}
                  <kbd className="settings-kbd">E</kbd>
                </span>
              </div>
              <div className="flex justify-between settings-label">
                <span>Create new prompt</span>
                <span>
                  <kbd className="settings-kbd">Alt</kbd>
                  {' + '}
                  <kbd className="settings-kbd">N</kbd>
                </span>
              </div>
              <div className="flex justify-between settings-label">
                <span>Open settings</span>
                <span>
                  <kbd className="settings-kbd">Alt</kbd>
                  {' + '}
                  <kbd className="settings-kbd">,</kbd>
                </span>
              </div>
              <div className="flex justify-between settings-label">
                <span>Close / Dismiss</span>
                <kbd className="settings-kbd">Esc</kbd>
              </div>
            </div>
          </SettingsGroup>
        </TabPanel>

        {/* Appearance Tab */}
        <TabPanel id="appearance" className="space-y-6">
          <SettingsGroup title="Theme">
            <Select
              label="Color theme"
              value={config.theme}
              onChange={(e) => handleThemeChange(e.target.value as Theme)}
              options={[
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
                { value: 'system', label: 'System' },
              ]}
            />
          </SettingsGroup>

          <SettingsGroup title="Editor">
            <SettingsNumber
              label="Font size"
              description="Editor font size in pixels"
              value={config.editor_font_size}
              onChange={(v) => updateConfig('editor_font_size', v)}
              min={10}
              max={24}
            />
            <SettingsToggle
              label="Word wrap"
              description="Wrap long lines in the editor"
              checked={config.editor_word_wrap}
              onChange={(v) => updateConfig('editor_word_wrap', v)}
            />
          </SettingsGroup>
        </TabPanel>

        {/* Storage Tab */}
        <TabPanel id="storage" className="space-y-6">
          <SettingsGroup title="Prompts Location">
            <Input
              label="Prompts directory"
              value={config.prompts_dir}
              onChange={(e) => updateConfig('prompts_dir', e.target.value)}
              placeholder="~/.prompter/prompts"
            />
            <p className="settings-description mt-2">
              Where your prompt files are stored. Supports cloud sync via iCloud, OneDrive, etc.
            </p>
          </SettingsGroup>

          <SettingsGroup title="Backup">
            <SettingsToggle
              label="Enable automatic backups"
              description="Periodically backup your prompts"
              checked={config.backup_enabled}
              onChange={(v) => updateConfig('backup_enabled', v)}
            />
            {config.backup_enabled && (
              <SettingsNumber
                label="Backup interval (hours)"
                description="How often to create backups"
                value={config.backup_interval_hours}
                onChange={(v) => updateConfig('backup_interval_hours', v)}
                min={1}
                max={168}
              />
            )}
          </SettingsGroup>
        </TabPanel>

        {/* Advanced Tab */}
        <TabPanel id="advanced" className="space-y-6">
          <SettingsGroup title="Analytics">
            <SettingsToggle
              label="Enable usage analytics"
              description="Track which prompts you use to improve recommendations"
              checked={config.analytics_enabled}
              onChange={(v) => updateConfig('analytics_enabled', v)}
            />
          </SettingsGroup>

          <SettingsGroup title="Language">
            <Select
              label="Interface language"
              value={config.language}
              onChange={(e) => updateConfig('language', e.target.value)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
                { value: 'fr', label: 'French' },
                { value: 'de', label: 'German' },
                { value: 'ja', label: 'Japanese' },
                { value: 'zh', label: 'Chinese' },
              ]}
            />
          </SettingsGroup>

          <SettingsGroup title="About">
            <div className="settings-about">
              <p className="font-semibold">Prompter</p>
              <p>A Spotlight-style prompt manager for Windows</p>
              <p className="text-xs mt-4">
                Made with Tauri, React, and Rust
              </p>
            </div>
          </SettingsGroup>
        </TabPanel>
      </Tabs>

      {/* Toasts */}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}

function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <div className="space-y-4">
      <h3 className="settings-group-title">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

interface SettingsToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function SettingsToggle({ label, description, checked, onChange }: SettingsToggleProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className={`settings-toggle-track ${checked ? 'checked' : ''}`} />
        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
      </div>
      <div className="flex-1">
        <p className="settings-label group-hover:opacity-100 opacity-90">
          {label}
        </p>
        {description && (
          <p className="settings-description">{description}</p>
        )}
      </div>
    </label>
  );
}

interface SettingsNumberProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

function SettingsNumber({
  label,
  description,
  value,
  onChange,
  min,
  max,
}: SettingsNumberProps) {
  const inputId = `settings-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="settings-label">{label}</label>
      <input
        id={inputId}
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        min={min}
        max={max}
        className="w-24 settings-input"
        aria-label={label}
      />
      {description && (
        <p className="settings-description">{description}</p>
      )}
    </div>
  );
}

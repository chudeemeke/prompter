import { useState } from 'react';
import {
  FileText, Code, Briefcase, MessageSquare,
  Lightbulb, BookOpen, PenTool, Zap,
  Terminal, Database, Globe, Settings,
  Users, Star, Heart, Bookmark,
  Search, Filter, Layout, Layers
} from 'lucide-react';

// Available icons for prompts
const ICONS = [
  { name: 'file-text', component: FileText },
  { name: 'code', component: Code },
  { name: 'briefcase', component: Briefcase },
  { name: 'message-square', component: MessageSquare },
  { name: 'lightbulb', component: Lightbulb },
  { name: 'book-open', component: BookOpen },
  { name: 'pen-tool', component: PenTool },
  { name: 'zap', component: Zap },
  { name: 'terminal', component: Terminal },
  { name: 'database', component: Database },
  { name: 'globe', component: Globe },
  { name: 'settings', component: Settings },
  { name: 'users', component: Users },
  { name: 'star', component: Star },
  { name: 'heart', component: Heart },
  { name: 'bookmark', component: Bookmark },
  { name: 'search', component: Search },
  { name: 'filter', component: Filter },
  { name: 'layout', component: Layout },
  { name: 'layers', component: Layers },
] as const;

export type IconName = typeof ICONS[number]['name'];

interface IconPickerProps {
  label?: string;
  value: string;
  onChange: (icon: string) => void;
}

/**
 * Icon picker component for selecting prompt icons
 */
export function IconPicker({ label, value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const SelectedIcon = ICONS.find(i => i.name === value)?.component || FileText;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700
            rounded-lg text-white hover:border-gray-600 transition-colors
            ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
          `}
        >
          <SelectedIcon size={20} />
          <span className="text-sm text-gray-400">Select icon</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 top-full mt-2 p-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
              <div className="grid grid-cols-5 gap-1">
                {ICONS.map(({ name, component: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      onChange(name);
                      setIsOpen(false);
                    }}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${value === name
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                    title={name}
                  >
                    <Icon size={20} />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Render an icon by name
 */
export function getIconComponent(name: string) {
  const icon = ICONS.find(i => i.name === name);
  return icon?.component || FileText;
}

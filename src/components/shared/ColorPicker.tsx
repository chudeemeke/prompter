import { useState } from 'react';

// Predefined colors for prompts (Tailwind palette)
const COLORS = [
  { name: 'Blue', value: '#3B82F6', class: 'bg-blue-500' },
  { name: 'Indigo', value: '#6366F1', class: 'bg-indigo-500' },
  { name: 'Purple', value: '#8B5CF6', class: 'bg-purple-500' },
  { name: 'Pink', value: '#EC4899', class: 'bg-pink-500' },
  { name: 'Red', value: '#EF4444', class: 'bg-red-500' },
  { name: 'Orange', value: '#F97316', class: 'bg-orange-500' },
  { name: 'Yellow', value: '#EAB308', class: 'bg-yellow-500' },
  { name: 'Green', value: '#22C55E', class: 'bg-green-500' },
  { name: 'Teal', value: '#14B8A6', class: 'bg-teal-500' },
  { name: 'Cyan', value: '#06B6D4', class: 'bg-cyan-500' },
  { name: 'Gray', value: '#6B7280', class: 'bg-gray-500' },
  { name: 'Slate', value: '#64748B', class: 'bg-slate-500' },
] as const;

export type ColorValue = typeof COLORS[number]['value'];

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
}

/**
 * Color picker component for selecting prompt colors
 */
export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedColor = COLORS.find(c => c.value === value) || COLORS[0];

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
          <div
            className="w-5 h-5 rounded-full"
            style={{ backgroundColor: value || selectedColor.value }}
          />
          <span className="text-sm text-gray-400">{selectedColor.name}</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 top-full mt-2 p-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
              <div className="grid grid-cols-6 gap-1">
                {COLORS.map(({ name, value: colorValue }) => (
                  <button
                    key={colorValue}
                    type="button"
                    onClick={() => {
                      onChange(colorValue);
                      setIsOpen(false);
                    }}
                    className={`
                      w-8 h-8 rounded-full transition-transform hover:scale-110
                      ${value === colorValue ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : ''}
                    `}
                    style={{ backgroundColor: colorValue }}
                    title={name}
                  />
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
 * Get color name from value
 */
export function getColorName(value: string): string {
  return COLORS.find(c => c.value === value)?.name || 'Unknown';
}

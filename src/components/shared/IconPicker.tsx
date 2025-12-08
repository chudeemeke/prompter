import { useState } from 'react';
import {
  FileText, Code, Briefcase, MessageSquare,
  Lightbulb, BookOpen, PenTool, Zap,
  Terminal, Database, Globe, Settings,
  Users, Star, Heart, Bookmark,
  Search, Filter, Layout, Layers,
  // Additional icons for sample prompts
  CheckSquare, Activity, Edit3, Tv,
  Mail, Coffee, Bug, Video, Award,
  Clipboard, PenLine, Brain, Newspaper,
  Calendar, Clock, AlertCircle, Info,
  HelpCircle, Play, Pause, SkipForward,
  Volume2, Mic, Camera, Image, Film,
  Music, Headphones, Radio, Wifi,
  Send, Download, Upload, Share2,
  Link, ExternalLink, Eye, EyeOff,
  Lock, Unlock, Key, Shield,
  Home, MapPin, Navigation, Compass,
  Sun, Moon, Cloud, CloudRain,
  Thermometer, Wind, Umbrella, Snowflake,
  Flame, Droplet, Leaf, TreePine,
  Mountain, Waves, Anchor, Ship,
  Plane, Car, Truck, Train, Bike,
  Rocket, Satellite, Target, Crosshair,
  Flag, Trophy, Medal, Gift,
  Package, Box, Archive, Folder,
  FolderOpen, File, FileCode, FilePlus,
  FileCheck, FileX, Files, Copy,
  Scissors, Trash2, RefreshCw, RotateCcw,
  Plus, Minus, X, Check,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  type LucideIcon,
} from 'lucide-react';

// Complete icon registry - maps icon names to components
const ICON_REGISTRY: Record<string, LucideIcon> = {
  // Original icons
  'file-text': FileText,
  'code': Code,
  'briefcase': Briefcase,
  'message-square': MessageSquare,
  'lightbulb': Lightbulb,
  'book-open': BookOpen,
  'pen-tool': PenTool,
  'zap': Zap,
  'terminal': Terminal,
  'database': Database,
  'globe': Globe,
  'settings': Settings,
  'users': Users,
  'star': Star,
  'heart': Heart,
  'bookmark': Bookmark,
  'search': Search,
  'filter': Filter,
  'layout': Layout,
  'layers': Layers,
  // Additional icons for sample prompts
  'check-square': CheckSquare,
  'activity': Activity,
  'edit-3': Edit3,
  'edit': Edit3,
  'tv': Tv,
  'mail': Mail,
  'coffee': Coffee,
  'bug': Bug,
  'video': Video,
  'award': Award,
  'clipboard': Clipboard,
  'pen-line': PenLine,
  'brain': Brain,
  'newspaper': Newspaper,
  'calendar': Calendar,
  'clock': Clock,
  'alert-circle': AlertCircle,
  'info': Info,
  'help-circle': HelpCircle,
  'play': Play,
  'pause': Pause,
  'skip-forward': SkipForward,
  'volume-2': Volume2,
  'mic': Mic,
  'camera': Camera,
  'image': Image,
  'film': Film,
  'music': Music,
  'headphones': Headphones,
  'radio': Radio,
  'wifi': Wifi,
  'send': Send,
  'download': Download,
  'upload': Upload,
  'share-2': Share2,
  'link': Link,
  'external-link': ExternalLink,
  'eye': Eye,
  'eye-off': EyeOff,
  'lock': Lock,
  'unlock': Unlock,
  'key': Key,
  'shield': Shield,
  'home': Home,
  'map-pin': MapPin,
  'navigation': Navigation,
  'compass': Compass,
  'sun': Sun,
  'moon': Moon,
  'cloud': Cloud,
  'cloud-rain': CloudRain,
  'thermometer': Thermometer,
  'wind': Wind,
  'umbrella': Umbrella,
  'snowflake': Snowflake,
  'flame': Flame,
  'droplet': Droplet,
  'leaf': Leaf,
  'tree-pine': TreePine,
  'mountain': Mountain,
  'waves': Waves,
  'anchor': Anchor,
  'ship': Ship,
  'plane': Plane,
  'car': Car,
  'truck': Truck,
  'train': Train,
  'bike': Bike,
  'rocket': Rocket,
  'satellite': Satellite,
  'target': Target,
  'crosshair': Crosshair,
  'flag': Flag,
  'trophy': Trophy,
  'medal': Medal,
  'gift': Gift,
  'package': Package,
  'box': Box,
  'archive': Archive,
  'folder': Folder,
  'folder-open': FolderOpen,
  'file': File,
  'file-code': FileCode,
  'file-plus': FilePlus,
  'file-check': FileCheck,
  'file-x': FileX,
  'files': Files,
  'copy': Copy,
  'scissors': Scissors,
  'trash-2': Trash2,
  'refresh-cw': RefreshCw,
  'rotate-ccw': RotateCcw,
  'plus': Plus,
  'minus': Minus,
  'x': X,
  'check': Check,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
};

// Icons shown in the picker UI (subset of all available)
const PICKER_ICONS = [
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
  { name: 'check-square', component: CheckSquare },
  { name: 'activity', component: Activity },
  { name: 'edit-3', component: Edit3 },
  { name: 'tv', component: Tv },
  { name: 'mail', component: Mail },
  { name: 'video', component: Video },
  { name: 'clipboard', component: Clipboard },
  { name: 'calendar', component: Calendar },
  { name: 'brain', component: Brain },
  { name: 'rocket', component: Rocket },
] as const;

export type IconName = typeof PICKER_ICONS[number]['name'];

/**
 * Check if a string is an emoji (single or multi-codepoint)
 */
function isEmoji(str: string): boolean {
  if (!str || str.length === 0) return false;
  // Check for common emoji patterns
  const emojiRegex = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  return emojiRegex.test(str);
}

interface DynamicIconProps {
  icon: string;
  size?: number;
  className?: string;
}

/**
 * Renders either a Lucide icon or an emoji based on the icon string.
 * - If the icon is in the ICON_REGISTRY, renders the Lucide icon
 * - If the icon looks like an emoji, renders it as text
 * - Falls back to FileText icon if nothing matches
 */
export function DynamicIcon({ icon, size = 20, className = '' }: DynamicIconProps) {
  // Check if it's a registered Lucide icon
  const LucideIcon = ICON_REGISTRY[icon];
  if (LucideIcon) {
    return <LucideIcon size={size} className={className} />;
  }

  // Check if it's an emoji
  if (isEmoji(icon)) {
    return (
      <span
        className={className}
        style={{ fontSize: size * 0.9, lineHeight: 1 }}
      >
        {icon}
      </span>
    );
  }

  // Fallback to FileText
  return <FileText size={size} className={className} />;
}

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

  const SelectedIcon = PICKER_ICONS.find(i => i.name === value)?.component || FileText;

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
            <div className="absolute z-20 top-full mt-2 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
              <div className="grid grid-cols-5 gap-3">
                {PICKER_ICONS.map(({ name, component: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      onChange(name);
                      setIsOpen(false);
                    }}
                    className={`
                      p-2.5 rounded-lg transition-all
                      ${value === name
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : 'text-gray-300 hover:bg-gray-700/80 hover:text-white hover:scale-105'
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
 * Render an icon by name (returns component, for backward compatibility)
 */
export function getIconComponent(name: string): LucideIcon {
  return ICON_REGISTRY[name] || FileText;
}

/**
 * Check if an icon name is a registered Lucide icon
 */
export function isLucideIcon(name: string): boolean {
  return name in ICON_REGISTRY;
}

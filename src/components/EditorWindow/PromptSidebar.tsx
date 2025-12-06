import { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, ChevronRight, ChevronDown,
  Folder, FolderOpen, FileText
} from 'lucide-react';
import type { Prompt, PromptFolder } from '../../lib/types';
import type { PromptService } from '../../services/PromptService';

// =============================================================================
// TYPES
// =============================================================================

interface PromptSidebarProps {
  service: PromptService;
  selectedPromptId?: string;
  onSelectPrompt: (promptId: string) => void;
  onNewPrompt: () => void;
}

interface FolderWithPrompts extends PromptFolder {
  prompts: Prompt[];
  isExpanded: boolean;
}

// =============================================================================
// COMPONENT: PromptSidebar
// =============================================================================

export function PromptSidebar({
  service,
  selectedPromptId,
  onSelectPrompt,
  onNewPrompt,
}: PromptSidebarProps) {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [folders, setFolders] = useState<PromptFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [promptsData, foldersData] = await Promise.all([
          service.getAllPrompts(),
          service.getFolders(),
        ]);
        setPrompts(promptsData);
        setFolders(foldersData);
        // Expand all folders by default
        setExpandedFolders(new Set(foldersData.map(f => f.id)));
      } catch (error) {
        console.error('[PromptSidebar] Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [service]);

  // ---------------------------------------------------------------------------
  // COMPUTED DATA
  // ---------------------------------------------------------------------------

  const filteredPrompts = useMemo(() => {
    if (!filterQuery.trim()) return prompts;
    const query = filterQuery.toLowerCase();
    return prompts.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.folder.toLowerCase().includes(query)
    );
  }, [prompts, filterQuery]);

  const folderTree = useMemo(() => {
    const folderMap = new Map<string, FolderWithPrompts>();

    // Initialize folders
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        prompts: [],
        isExpanded: expandedFolders.has(folder.id),
      });
    });

    // Add "Uncategorized" for prompts without folder
    folderMap.set('', {
      id: '',
      name: 'Uncategorized',
      prompt_count: 0,
      created_at: new Date().toISOString(),
      prompts: [],
      isExpanded: expandedFolders.has(''),
    });

    // Group prompts by folder
    filteredPrompts.forEach(prompt => {
      const folderId = prompt.folder || '';
      const folder = folderMap.get(folderId);
      if (folder) {
        folder.prompts.push(prompt);
        folder.prompt_count = folder.prompts.length;
      } else {
        // Folder doesn't exist, add to uncategorized
        const uncategorized = folderMap.get('');
        if (uncategorized) {
          uncategorized.prompts.push(prompt);
          uncategorized.prompt_count = uncategorized.prompts.length;
        }
      }
    });

    // Convert to array and filter out empty folders when searching
    return Array.from(folderMap.values())
      .filter(f => f.prompts.length > 0 || !filterQuery)
      .sort((a, b) => {
        // Uncategorized always at the end
        if (a.id === '') return 1;
        if (b.id === '') return -1;
        return a.name.localeCompare(b.name);
      });
  }, [folders, filteredPrompts, expandedFolders, filterQuery]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <aside className="prompt-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Prompts</h2>
        </div>
        <div className="sidebar-loading">
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-8 bg-gray-700/50 rounded" />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="prompt-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">Prompts</h2>
        <button
          type="button"
          onClick={onNewPrompt}
          className="sidebar-new-btn"
          title="New Prompt (Ctrl+N)"
        >
          <Plus size={14} />
          <span>New</span>
        </button>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <Search size={14} className="sidebar-search-icon" />
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter prompts..."
          className="sidebar-search-input"
        />
      </div>

      {/* Folder Tree */}
      <div className="sidebar-tree">
        {folderTree.map(folder => (
          <div key={folder.id} className="folder-group">
            {/* Folder Header */}
            <button
              type="button"
              className="folder-header"
              onClick={() => toggleFolder(folder.id)}
            >
              <span className="folder-chevron">
                {folder.isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </span>
              <span className="folder-icon">
                {folder.isExpanded ? (
                  <FolderOpen size={14} />
                ) : (
                  <Folder size={14} />
                )}
              </span>
              <span className="folder-name">{folder.name}</span>
              <span className="folder-count">({folder.prompt_count})</span>
            </button>

            {/* Prompt List */}
            {folder.isExpanded && (
              <div className="prompt-list">
                {folder.prompts.map(prompt => (
                  <button
                    key={prompt.id}
                    type="button"
                    className={`prompt-item ${selectedPromptId === prompt.id ? 'selected' : ''}`}
                    onClick={() => onSelectPrompt(prompt.id)}
                  >
                    <span
                      className="prompt-icon"
                      style={{ backgroundColor: prompt.color || '#6366f1' }}
                    >
                      <FileText size={12} />
                    </span>
                    <span className="prompt-name">{prompt.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {folderTree.length === 0 && filterQuery && (
          <div className="sidebar-empty">
            <p>No prompts match "{filterQuery}"</p>
          </div>
        )}

        {folderTree.length === 0 && !filterQuery && (
          <div className="sidebar-empty">
            <p>No prompts yet</p>
            <button
              type="button"
              onClick={onNewPrompt}
              className="sidebar-empty-btn"
            >
              Create your first prompt
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

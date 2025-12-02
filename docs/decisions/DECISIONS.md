# User Decisions - Prompter Configuration

This document records all design decisions made during planning.

---

## 1. Hotkey Configuration

**Decision:** `Ctrl+Space` (instead of default Ctrl+Shift+Space)

**Rationale:**
- Simpler, faster to press
- Common in many productivity tools (VS Code IntelliSense uses this)
- Less finger gymnastics than Ctrl+Shift+Space

**Implementation Note:**
- Still make it configurable in settings
- Default in config.json: `"hotkey": "Ctrl+Space"`

---

## 2. Storage Location

**Decision:** Option A - `~/.prompter/prompts/` (hidden directory)

**Rationale:**
- Keeps user's home directory clean
- Standard practice for config/data directories
- Still accessible for power users who need it
- Works well with cloud sync (see #5)

**Directory Structure:**
```
~/.prompter/
├── config.json          # User settings
├── usage.json           # Frecency data
└── prompts/             # Prompt files
    ├── Research/
    ├── Writing/
    └── Coding/
```

---

## 3. Auto-Paste Behavior

**Decision:** Option A (default) + Option C (configurable per-prompt)

**Implementation:**
1. **Global default:** Auto-paste enabled (simulate Ctrl+V)
2. **Per-prompt override:** Add `autoPaste` field to frontmatter
3. **Settings toggle:** User can disable globally

**Prompt frontmatter example:**
```yaml
---
name: "Code Snippet"
autoPaste: false    # Override global setting for this prompt
---
```

**Config.json:**
```json
{
  "autoPaste": true    // Global default
}
```

**Priority:**
1. Per-prompt `autoPaste` field (if present)
2. Global `config.json` setting
3. Hard-coded default: `true`

---

## 4. Editor Integration

**Decision:** Built-in markdown editor by default, configurable external editor

**Implementation:**

### Built-in Editor (Default)
- Full-featured markdown editor in Prompter
- Icon picker, color picker, folder assignment
- Variable editor with validation
- Live preview pane

### External Editor (Optional)
Settings panel option:

```json
{
  "externalEditor": {
    "enabled": false,
    "app": "notepad++"  // Options: "notepad", "notepad++", "vscode", "custom"
  }
}
```

**Supported editors:**
- Notepad (Windows default)
- Notepad++ (if installed)
- VS Code (if installed)
- Custom (user provides path)

**Behavior:**
- When enabled, "Edit" button opens file in external editor
- File watcher detects changes and reloads
- User can still use built-in editor as fallback

---

## 5. Cloud Sync Consideration

**Decision:** Yes - designed for cloud sync (iCloud, OneDrive, Dropbox, etc.)

**Design Principles:**

### File-Based Storage
- All prompts are plain `.md` files
- No database (avoids sync conflicts)
- Human-readable format (can edit anywhere)

### Cloud Sync Friendly Structure
```
~/.prompter/
├── config.json          # Local settings (NOT synced)
├── usage.json           # Local frecency data (NOT synced)
└── prompts/             # SYNC THIS FOLDER
    └── [all prompts]
```

### Sync Strategy
**Option A: User manually syncs `~/.prompter/prompts/`**
- Symlink to OneDrive/iCloud folder
- User's responsibility

**Option B: Settings panel with sync location**
```json
{
  "promptsDir": "C:/Users/Destiny/OneDrive/Prompter"
}
```

**Recommendation:** Option B (configurable)

### Conflict Resolution
- Use file modification timestamps
- File watcher detects external changes
- UI shows notification: "Prompts updated externally, reloading..."
- No merge conflicts (files are independent)

---

## 6. Extended MVP Features

Beyond the YouTuber's scope (Hotkey + Search + Paste), add these for v1:

### Tier 1: Must-Have for MVP

| Feature | Why It Matters | Complexity |
|---------|----------------|------------|
| **Prompt Categories/Folders** | Organize prompts by use case | Medium |
| **Variable Substitution** | Reusable templates | Medium |
| **Frecency Sorting** | Most-used prompts surface first | Low |
| **Recent Prompts** | Quick access to last 5-10 used | Low |
| **Prompt Preview** | See full content before selecting | Low |
| **Keyboard Shortcuts Guide** | Discoverability (press `?`) | Low |

### Tier 2: High-Value Additions

| Feature | Why It Matters | Complexity |
|---------|----------------|------------|
| **Quick Actions** | Copy without paste, edit, delete | Low |
| **Multi-line Variable Input** | Support longer context | Low |
| **Prompt Snippets** | Partial content injection | Medium |
| **Tag-based Filtering** | #research, #code, #email | Low |
| **Export/Import** | Backup, share prompt packs | Medium |
| **Dark/Light Theme** | User preference | Low |

### Tier 3: Advanced Features (Phase 4)

| Feature | Why It Matters | Complexity |
|---------|----------------|------------|
| **Template Collections** | Curated prompt sets | Medium |
| **Prompt Chaining** | Multi-step workflows | High |
| **Clipboard History Integration** | Use clipboard as variable | Medium |
| **AI-Powered Suggestions** | Recommend prompts based on context | High |
| **Team Sharing** | Shared prompt library | High |

---

## MVP Feature Breakdown (Detailed)

### 1. Prompt Categories/Folders

**UI:**
- Sidebar shows folder tree
- Filter by folder (click folder name)
- Breadcrumb navigation

**File Structure:**
```
prompts/
├── Research/
│   ├── ai-news.md
│   └── market-analysis.md
├── Writing/
│   ├── email-reply.md
│   └── blog-post.md
└── Coding/
    └── code-review.md
```

**Search Integration:**
- Search within folder (when folder selected)
- Search all (default)

---

### 2. Variable Substitution

**Already in base plan**, but emphasize:

**Multi-variable support:**
```markdown
---
variables:
  - name: "topic"
    default: "AI"
    required: true
  - name: "timeframe"
    default: "last week"
    required: false
---

Give me {{timeframe}} news about {{topic}}.
```

**Context Modal:**
- Shows all variables
- Pre-filled with defaults
- Tab navigation between fields
- Enter to confirm

---

### 3. Frecency Sorting

**Already in Agent A plan**, but clarify UI:

**Display:**
- Show usage count badge on frequently used prompts
- "🔥 Hot" indicator for top 3 most-used
- Empty search shows frecency-sorted list

**Algorithm:**
```
score = use_count * recency_decay
recency_decay = 1.0 / (1.0 + days_since_last_use * 0.1)
```

---

### 4. Recent Prompts

**Special section in UI:**

```
┌─────────────────────────────────────┐
│ Search prompts...                   │
├─────────────────────────────────────┤
│ 🕐 Recent                           │
│   📰 AI News Summary                │
│   ✉️ Email Reply Template           │
│   💻 Code Review Checklist          │
├─────────────────────────────────────┤
│ All Prompts (sorted by frecency)   │
│   ...                               │
└─────────────────────────────────────┘
```

**Keyboard Shortcut:**
- `Ctrl+R` to jump to recent
- `Ctrl+A` to jump to all

---

### 5. Prompt Preview

**Behavior:**
- Hover over prompt for 500ms shows tooltip with full content
- Or: Arrow Right expands preview pane

**Layout:**
```
┌─────────────────┬─────────────────────┐
│ Search results  │ Preview Pane        │
│                 │                     │
│ > AI News       │ ---                 │
│   Email Reply   │ name: "AI News..."  │
│   Code Review   │ ---                 │
│                 │                     │
│                 │ Give me a summary   │
│                 │ of {{topic}} news...│
└─────────────────┴─────────────────────┘
```

**Toggle:** `Ctrl+P` to show/hide preview pane

---

### 6. Keyboard Shortcuts Guide

**Overlay when `?` pressed:**

```
┌─────────────────────────────────────────────┐
│            Keyboard Shortcuts               │
├─────────────────────────────────────────────┤
│  Navigation                                 │
│    ↑ ↓           Navigate results           │
│    Tab           Fill variables             │
│    Shift+Tab     Previous field             │
│                                             │
│  Actions                                    │
│    Enter         Select and paste           │
│    Ctrl+Enter    Select without paste       │
│    Escape        Close window               │
│                                             │
│  Quick Access                               │
│    Ctrl+R        Recent prompts             │
│    Ctrl+N        New prompt                 │
│    Ctrl+E        Edit selected prompt       │
│    Ctrl+D        Delete selected prompt     │
│                                             │
│  View                                       │
│    Ctrl+P        Toggle preview pane        │
│    Ctrl+/        Toggle sidebar             │
│    ?             Show this help             │
└─────────────────────────────────────────────┘
```

---

### 7. Quick Actions (Context Menu)

**Right-click or `Ctrl+.` on a prompt:**

```
┌──────────────────────┐
│ Copy                 │  Ctrl+C
│ Copy without paste   │  Ctrl+Shift+C
│ Edit                 │  Ctrl+E
│ Duplicate            │  Ctrl+Shift+D
│ Delete               │  Ctrl+D
│ Move to folder...    │
│ Add to favorites     │  Ctrl+F
└──────────────────────┘
```

---

### 8. Tag-Based Filtering

**Frontmatter:**
```yaml
tags: ["research", "ai", "news"]
```

**UI:**
- Tags shown as pills on result items
- Click tag to filter by that tag
- Tag cloud in sidebar (show all tags with count)

**Search syntax:**
- `#research` - filter by tag
- `ai #research` - search "ai" within #research tag

---

### 9. Export/Import

**Settings Panel:**
- Export All → `prompts-backup-2025-11-30.zip`
- Import → select zip file, merge or replace

**Format:**
```
prompts-backup.zip
├── prompts/
│   ├── Research/
│   └── Writing/
└── manifest.json  # Metadata
```

**Use Cases:**
- Backup before sync
- Share prompt collections
- Migrate to new machine

---

### 10. Dark/Light Theme

**Settings:**
```json
{
  "theme": "dark"  // Options: "dark", "light", "system"
}
```

**Implementation:**
- CSS variables for colors
- Tailwind dark mode
- Smooth transition

---

## Feature Priority Matrix

| Feature | Value | Effort | Priority | Phase |
|---------|-------|--------|----------|-------|
| Hotkey + Search + Paste | 🔥🔥🔥 | Medium | P0 | MVP |
| Variable Substitution | 🔥🔥🔥 | Medium | P0 | MVP |
| Folders/Categories | 🔥🔥 | Medium | P1 | MVP |
| Frecency Sorting | 🔥🔥 | Low | P1 | MVP |
| Recent Prompts | 🔥🔥 | Low | P1 | MVP |
| Keyboard Guide | 🔥 | Low | P1 | MVP |
| Quick Actions | 🔥🔥 | Low | P2 | Phase 4 |
| Tag Filtering | 🔥 | Low | P2 | Phase 4 |
| Preview Pane | 🔥 | Low | P2 | Phase 4 |
| Export/Import | 🔥 | Medium | P3 | Phase 4 |
| Theme Switching | 🔥 | Low | P3 | Phase 4 |

---

## Updated MVP Scope

### What We'll Build in Parallel (Phase 2)

**Agent A (Data):**
- File storage with folders
- Fuzzy search
- Frecency tracking
- **Recent prompts tracking** (new)
- **Tag extraction** (new)

**Agent B (OS):**
- Hotkey registration (Ctrl+Space)
- Window focus tracking
- Auto-paste with per-prompt override
- Clipboard management

**Agent C (UI):**
- Spotlight window
- Search with keyboard nav
- Variable context modal
- **Folder tree sidebar** (new)
- **Recent prompts section** (new)
- **Keyboard shortcuts overlay** (new)

### What We'll Add in Integration (Phase 3)

- Wire folders to UI
- Wire recent prompts
- Wire keyboard shortcuts
- Settings for external editor
- Settings for auto-paste default

---

## Next Steps

1. ✅ User decisions documented
2. ⏳ Update agent plans with new features
3. ⏳ Create updated wireframes/mockups
4. ⏳ Get final approval
5. ⏳ Begin Phase 1 (Foundation)

---

## Configuration Files

### config.json (Updated)

```json
{
  "version": "1.0.0",
  "hotkey": "Ctrl+Space",
  "promptsDir": "~/.prompter/prompts",
  "theme": "dark",
  "autoPaste": true,
  "showInTray": true,
  "maxResults": 10,
  "maxRecentPrompts": 5,
  "externalEditor": {
    "enabled": false,
    "app": "vscode"
  },
  "ui": {
    "showPreviewPane": false,
    "showSidebar": true,
    "windowWidth": 700,
    "windowHeight": 500
  }
}
```

### usage.json (Updated)

```json
{
  "prompts": {
    "research/ai-news.md": {
      "useCount": 45,
      "lastUsed": "2025-11-30T14:22:00Z"
    }
  },
  "recent": [
    "research/ai-news.md",
    "writing/email-reply.md",
    "coding/code-review.md"
  ]
}
```

---

**Status:** Ready for wireframe/mockup design and final approval.

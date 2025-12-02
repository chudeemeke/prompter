# Prompter - Windows 11 Prompt Manager

## Executive Summary

A **Spotlight-style prompt manager** for Windows 11 inspired by [this YouTube video](https://www.youtube.com/watch?v=w_wbKLOjqeE).

**Core workflow:**
1. Press a global hotkey anywhere in Windows
2. A floating search window appears (like macOS Spotlight / PowerToys Run)
3. Search/select a prompt
4. Prompt gets pasted into the previously focused application

---

## Technology Stack

| macOS (Video) | Windows 11 (Ours) | Rationale |
|---------------|-------------------|-----------|
| Swift UI | **React + TailwindCSS** | Cross-platform UI, rapid development |
| Rust | **Rust (via Tauri)** | Native performance, same language as video |
| AppKit | **Tauri v2** | Native Windows integration, small binary (~5MB vs 150MB Electron) |
| macOS Spotlight | **Custom overlay window** | Frameless, always-on-top, blur effect |

---

## Architecture Layers

```
+---------------------------------------------------------------+
|                           UI LAYER                            |
+-------------------+-------------------+-----------------------+
| Spotlight Window  | Markdown Editor   | Folder Organization   |
+-------------------+-------------------+-----------------------+

+---------------------------------------------------------------+
|                      INTERACTION LAYER                        |
+-------------------------------+-------------------------------+
| Keyboard Navigation           | Prompt Selection              |
+-------------------------------+-------------------------------+

+---------------------------------------------------------------+
|                    OS INTEGRATION LAYER                       |
+-------------------------------+-------------------------------+
| Hotkey                        | Paste                         |
+-------------------------------+-------------------------------+

+---------------------------------------------------------------+
|                        DATA LAYER                             |
+-------------------+-------------------+-----------------------+
| File Storage      | Search            | Sort by Frequency     |
+-------------------+-------------------+-----------------------+
```

---

# PART 1: ORCHESTRATOR PLAN

This section is for the **orchestrator** (Claude in the main terminal) who coordinates the entire build.

**How it works:** You (the user) stay in this single terminal. I (Claude) spawn parallel agents using the Task tool. They run simultaneously, report back to me, and I handle integration. You don't need to open other terminals.

---

## Orchestration Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR WORKFLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PHASE 1: Foundation (Orchestrator executes directly)           │
│     │                                                           │
│     ▼                                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ FOUNDATION CHECKPOINT                                   │    │
│  │ - npm run tauri dev works?                              │    │
│  │ - Window opens (frameless, centered)?                   │    │
│  │ - Types defined in src/lib/types.ts?                    │    │
│  │ - Rust compiles with module stubs?                      │    │
│  │ - Mock data exists in src/lib/mocks.ts?                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│     │                                                           │
│     │ ALL CHECKS PASS? ──► IMMEDIATELY spawn agents             │
│     ▼                                                           │
│  PHASE 2: Parallel Development                                  │
│     │                                                           │
│     ├──► Agent A: Data Layer (Rust)                             │
│     ├──► Agent B: OS Integration (Rust)                         │
│     └──► Agent C: UI Layer (React)                              │
│     │                                                           │
│     │ (All 3 run SIMULTANEOUSLY in one Task tool call)          │
│     ▼                                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ PARALLEL CHECKPOINT                                     │    │
│  │ - Agent A: Can read/write/search prompts?               │    │
│  │ - Agent B: Hotkey shows window, paste works?            │    │
│  │ - Agent C: UI renders, keyboard nav works?              │    │
│  └─────────────────────────────────────────────────────────┘    │
│     │                                                           │
│     ▼                                                           │
│  PHASE 3: Integration (Orchestrator executes directly)          │
│     │                                                           │
│     ▼                                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ INTEGRATION CHECKPOINT                                  │    │
│  │ - Full flow: hotkey → search → select → paste works?    │    │
│  │ - No type mismatches between frontend/backend?          │    │
│  └─────────────────────────────────────────────────────────┘    │
│     │                                                           │
│     ▼                                                           │
│  PHASE 4: Polish (Optional parallel agents)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: Foundation (Orchestrator Direct)

### Goal
Minimal scaffold that compiles. NO features. Just enough for agents to work independently.

### Foundation Checkpoint Criteria

```
FOUNDATION CHECKPOINT - ALL MUST PASS
=====================================

[ ] 1. PROJECT STRUCTURE
    Command: npm run tauri dev
    Expected: Window opens (can be blank)

[ ] 2. WINDOW CONFIGURATION
    File: src-tauri/tauri.conf.json
    Expected: Frameless, centered, transparent, alwaysOnTop, hidden by default

[ ] 3. TYPESCRIPT TYPES
    File: src/lib/types.ts
    Expected: Prompt, SearchResult, Variable, Settings interfaces defined

[ ] 4. RUST MODULE STUBS
    Files: src-tauri/src/{commands,storage,os}/mod.rs
    Expected: Empty modules that compile, function signatures as comments

[ ] 5. MOCK DATA
    File: src/lib/mocks.ts
    Expected: 5-10 sample Prompt objects for UI development

[ ] 6. DEPENDENCIES DECLARED
    Files: package.json, Cargo.toml
    Expected: All dependencies listed (not necessarily used yet)

>>> STOP HERE AND SPAWN PARALLEL AGENTS <<<
```

### Foundation File Checklist

| File | Purpose | Agent That Uses It |
|------|---------|-------------------|
| `src/lib/types.ts` | Shared TypeScript interfaces | All agents |
| `src/lib/mocks.ts` | Mock prompt data | Agent C (UI) |
| `src-tauri/src/commands/mod.rs` | Command signatures | Agent A, B |
| `src-tauri/src/storage/mod.rs` | Storage module stub | Agent A |
| `src-tauri/src/os/mod.rs` | OS module stub | Agent B |
| `src-tauri/Cargo.toml` | Rust dependencies | Agent A, B |
| `src-tauri/tauri.conf.json` | Window config | Agent B, C |

---

## PHASE 2: Parallel Development

### Agent Isolation Rules

**CRITICAL:** Each agent works in isolated directories. No overlapping files.

```
AGENT FILE BOUNDARIES (NO OVERLAP)
==================================

Agent A (Data):
  OWNS: src-tauri/src/storage/**
  OWNS: src-tauri/src/commands/prompts.rs
  OWNS: src-tauri/src/commands/search.rs
  READS: src/lib/types.ts (for reference)

Agent B (OS Integration):
  OWNS: src-tauri/src/os/**
  OWNS: src-tauri/src/commands/clipboard.rs
  MODIFIES: src-tauri/src/main.rs (hotkey setup only)
  MODIFIES: src-tauri/tauri.conf.json (permissions only)

Agent C (UI):
  OWNS: src/components/**
  OWNS: src/hooks/**
  OWNS: src/styles/**
  MODIFIES: src/App.tsx
  READS: src/lib/mocks.ts
  READS: src/lib/types.ts

SHARED (created in Foundation, read-only during Phase 2):
  - src/lib/types.ts
  - src/lib/mocks.ts
  - src-tauri/src/commands/mod.rs (just the signatures)
```

### Orchestrator Spawns All 3 Simultaneously

```
Single message with 3 Task tool invocations:

┌─────────────────────────────────────────────────────────────────┐
│ Task Tool Call #1: Agent A (Data Layer)                         │
│   subagent_type: general-purpose                                │
│   prompt: [Contents of AGENT_A_DATA.md]                         │
├─────────────────────────────────────────────────────────────────┤
│ Task Tool Call #2: Agent B (OS Integration)                     │
│   subagent_type: general-purpose                                │
│   prompt: [Contents of AGENT_B_OS.md]                           │
├─────────────────────────────────────────────────────────────────┤
│ Task Tool Call #3: Agent C (UI Layer)                           │
│   subagent_type: general-purpose                                │
│   prompt: [Contents of AGENT_C_UI.md]                           │
└─────────────────────────────────────────────────────────────────┘

All 3 execute in parallel. Orchestrator waits for all to complete.
```

---

## PHASE 3: Integration

### Integration Points

After all agents complete, orchestrator connects their work:

```
INTEGRATION TASKS
=================

1. CONNECT UI TO DATA LAYER
   - Replace mock imports in UI with real Tauri invoke() calls
   - File: src/lib/tauri.ts
   - Wire: usePrompts hook → get_all_prompts command
   - Wire: useSearch hook → search_prompts command

2. CONNECT UI TO OS LAYER
   - Wire: prompt selection → copy_and_paste command
   - File: src/components/SpotlightWindow/index.tsx

3. CONNECT HOTKEY TO WINDOW
   - Hotkey event → window.show()
   - Escape key → window.hide() + restore focus
   - File: src-tauri/src/main.rs

4. REGISTER ALL COMMANDS
   - Add all commands to Tauri builder
   - File: src-tauri/src/main.rs
   - Commands: get_all_prompts, search_prompts, copy_and_paste, etc.

5. FIX TYPE MISMATCHES
   - Ensure Rust structs match TypeScript interfaces
   - Ensure serde serialization works correctly
```

### Integration Checkpoint

```
INTEGRATION CHECKPOINT - ALL MUST PASS
======================================

[ ] Hotkey (Ctrl+Shift+Space) shows the Prompter window
[ ] Prompter window appears centered, frameless, with blur
[ ] Search input is focused automatically
[ ] Typing filters the prompt list in real-time
[ ] Arrow keys navigate the results
[ ] Enter on a prompt:
    [ ] Copies prompt content to clipboard
    [ ] Hides the Prompter window
    [ ] Restores focus to previous application
    [ ] (Optional) Simulates Ctrl+V paste
[ ] Escape closes window and restores focus
[ ] Prompts load from ~/.prompter/prompts/ directory
```

---

## PHASE 4: Polish (Optional)

After MVP works, can spawn more parallel agents:

| Agent | Scope | Tasks |
|-------|-------|-------|
| Agent D | Editor | Markdown editor, icon picker, variable editor |
| Agent E | Folders | Sidebar, folder tree, drag-drop |
| Agent F | Settings | Settings panel, theme, hotkey config |

---

# PART 2: AGENT PLANS

Each agent gets a self-contained plan document. These are the prompts passed to the Task tool.

---

## AGENT A: Data Layer

**File:** See `docs/AGENT_A_DATA.md` for full prompt.

### Summary

| Attribute | Value |
|-----------|-------|
| **Scope** | `src-tauri/src/storage/`, `src-tauri/src/commands/{prompts,search}.rs` |
| **Language** | Rust |
| **Dependencies** | serde, serde_yaml, fuzzy-matcher, notify (file watcher) |
| **Inputs** | File system (`~/.prompter/prompts/`) |
| **Outputs** | Tauri commands: `get_all_prompts`, `search_prompts`, `save_prompt`, `delete_prompt` |

### Tasks

1. Parse Markdown files with YAML frontmatter
2. CRUD operations for prompt files
3. Fuzzy search across name, description, content, tags
4. Frecency tracking (usage count + last used)
5. File watcher for external changes
6. Unit tests for all functions

### Success Criteria

```
[ ] Can parse a .md file with YAML frontmatter into Prompt struct
[ ] Can list all prompts from ~/.prompter/prompts/
[ ] Can save a new prompt as .md file
[ ] Can delete a prompt file
[ ] Search returns relevant results for partial queries
[ ] Frecency sorts most-used prompts to top
```

### Files Agent A Creates

```
src-tauri/src/storage/
├── mod.rs              # Module exports
├── prompt_file.rs      # Markdown + YAML parsing
├── file_ops.rs         # Read/write/delete/list
├── watcher.rs          # File system watcher
└── frecency.rs         # Usage tracking

src-tauri/src/commands/
├── prompts.rs          # get_all_prompts, save_prompt, delete_prompt
└── search.rs           # search_prompts with fuzzy matching
```

---

## AGENT B: OS Integration Layer

**File:** See `docs/AGENT_B_OS.md` for full prompt.

### Summary

| Attribute | Value |
|-----------|-------|
| **Scope** | `src-tauri/src/os/`, hotkey setup, system tray |
| **Language** | Rust |
| **Dependencies** | windows-rs, tauri-plugin-global-shortcut, tauri-plugin-clipboard |
| **Inputs** | Windows API, keyboard events |
| **Outputs** | Tauri commands: `copy_and_paste`, window show/hide |

### Tasks

1. Track previously focused window (GetForegroundWindow)
2. Restore focus to previous window (SetForegroundWindow)
3. Copy text to clipboard
4. Simulate Ctrl+V keystroke (SendInput)
5. Register global hotkey (Ctrl+Shift+Space)
6. Show/hide window on hotkey
7. System tray with menu

### Success Criteria

```
[ ] Global hotkey works even when app is minimized
[ ] Pressing hotkey shows the window
[ ] Window appears in front of all other windows
[ ] After selection, focus returns to previous app
[ ] Text is on clipboard after selection
[ ] (Bonus) Ctrl+V is simulated automatically
```

### Files Agent B Creates

```
src-tauri/src/os/
├── mod.rs              # Module exports
├── window_focus.rs     # GetForegroundWindow, SetForegroundWindow
├── paste.rs            # Clipboard + SendInput for Ctrl+V
└── tray.rs             # System tray setup

src-tauri/src/commands/
└── clipboard.rs        # copy_and_paste command

(Also modifies)
src-tauri/src/main.rs   # Hotkey registration, tray setup
```

---

## AGENT C: UI Layer

**File:** See `docs/AGENT_C_UI.md` for full prompt.

### Summary

| Attribute | Value |
|-----------|-------|
| **Scope** | `src/components/`, `src/hooks/`, `src/styles/` |
| **Language** | TypeScript, React, TailwindCSS |
| **Dependencies** | React, TailwindCSS |
| **Inputs** | Mock data from `src/lib/mocks.ts` |
| **Outputs** | Rendered UI components |

### Tasks

1. SpotlightWindow component (main container)
2. SearchInput component with styling
3. ResultsList component
4. ResultItem component (icon, name, description)
5. Keyboard navigation hook (up/down/enter/escape)
6. Search filtering hook with debounce
7. ContextModal for variable input (Tab key)
8. Dark theme styling

### Success Criteria

```
[ ] Window renders with blur/acrylic background effect
[ ] Search input is auto-focused
[ ] Typing filters the mock prompts
[ ] Arrow keys change selected item (visual highlight)
[ ] Enter triggers onSelect callback
[ ] Escape triggers onClose callback
[ ] Tab on prompt with variables shows ContextModal
[ ] Looks polished (spacing, colors, typography)
```

### Files Agent C Creates

```
src/components/
├── SpotlightWindow/
│   ├── index.tsx           # Main container
│   ├── SearchInput.tsx     # Search bar
│   ├── ResultsList.tsx     # Scrollable list
│   ├── ResultItem.tsx      # Single prompt row
│   └── ContextModal.tsx    # Variable input modal
└── (index.ts barrel exports)

src/hooks/
├── useKeyboard.ts          # Keyboard navigation
├── useSearch.ts            # Debounced filtering
└── useSelectedIndex.ts     # Selection state

src/styles/
└── globals.css             # Tailwind + custom styles
```

---

# PART 3: SHARED CONTRACTS

These interfaces are created in Phase 1 and used by ALL agents.

## TypeScript Interfaces

```typescript
// src/lib/types.ts

export interface Prompt {
  id: string;                    // Relative path: "research/ai-news.md"
  name: string;                  // "AI News Summary"
  description?: string;          // "Get the latest AI news"
  content: string;               // The actual prompt text
  icon?: string;                 // Icon name: "newspaper"
  color?: string;                // Hex color: "#3B82F6"
  folder?: string;               // Folder name: "Research"
  variables?: Variable[];        // Template variables
  tags?: string[];               // ["news", "research"]
  created: string;               // ISO date string
  modified: string;              // ISO date string
}

export interface Variable {
  name: string;                  // "topic"
  default?: string;              // "AI"
  required: boolean;             // false
}

export interface SearchResult {
  prompt: Prompt;
  score: number;                 // Fuzzy match score
  matches: MatchRange[];         // Where matches occurred
}

export interface MatchRange {
  field: 'name' | 'description' | 'content' | 'tags';
  start: number;
  end: number;
}

export interface Settings {
  hotkey: string;                // "Ctrl+Shift+Space"
  promptsDir: string;            // "~/.prompter/prompts"
  theme: 'light' | 'dark' | 'system';
  autoPaste: boolean;            // Simulate Ctrl+V after copy
  showInTray: boolean;
  maxResults: number;            // 10
}

export interface UsageStats {
  promptId: string;
  useCount: number;
  lastUsed: string;              // ISO date string
}
```

## Rust Structs (Must Match TypeScript)

```rust
// src-tauri/src/commands/mod.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Prompt {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub content: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub folder: Option<String>,
    pub variables: Option<Vec<Variable>>,
    pub tags: Option<Vec<String>>,
    pub created: String,
    pub modified: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Variable {
    pub name: String,
    pub default: Option<String>,
    pub required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub prompt: Prompt,
    pub score: i64,
    pub matches: Vec<MatchRange>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchRange {
    pub field: String,
    pub start: usize,
    pub end: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub hotkey: String,
    pub prompts_dir: String,
    pub theme: String,
    pub auto_paste: bool,
    pub show_in_tray: bool,
    pub max_results: usize,
}
```

## Tauri Command Signatures

```rust
// Commands that Agent A implements:
#[tauri::command]
async fn get_all_prompts() -> Result<Vec<Prompt>, String>;

#[tauri::command]
async fn get_prompt(id: String) -> Result<Prompt, String>;

#[tauri::command]
async fn save_prompt(prompt: Prompt) -> Result<(), String>;

#[tauri::command]
async fn delete_prompt(id: String) -> Result<(), String>;

#[tauri::command]
async fn search_prompts(query: String) -> Result<Vec<SearchResult>, String>;

// Commands that Agent B implements:
#[tauri::command]
async fn copy_and_paste(text: String, auto_paste: bool) -> Result<(), String>;

#[tauri::command]
async fn get_settings() -> Result<Settings, String>;

#[tauri::command]
async fn save_settings(settings: Settings) -> Result<(), String>;
```

---

# PART 4: CONFIGURATION

## Prompt File Format

```markdown
---
name: "AI News Summary"
description: "Get the latest AI news"
icon: "newspaper"
color: "#3B82F6"
variables:
  - name: "topic"
    default: "AI"
    required: false
tags: ["news", "research", "ai"]
created: 2025-01-15T10:30:00Z
modified: 2025-01-20T14:22:00Z
---

Give me a summary of the latest {{topic}} news from the past week.
Focus on:
1. Major breakthroughs
2. Industry announcements
3. Research papers
```

## User Settings

```json
// ~/.prompter/config.json
{
  "hotkey": "Ctrl+Shift+Space",
  "promptsDir": "~/.prompter/prompts",
  "theme": "system",
  "autoPaste": true,
  "showInTray": true,
  "maxResults": 10
}
```

## Tauri Window Config

```json
// src-tauri/tauri.conf.json (relevant excerpt)
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Prompter",
        "width": 600,
        "height": 400,
        "resizable": false,
        "decorations": false,
        "transparent": true,
        "center": true,
        "visible": false,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "focus": false
      }
    ]
  }
}
```

---

# PART 5: OPEN QUESTIONS

Before implementation, confirm these decisions:

| # | Question | Options | Default |
|---|----------|---------|---------|
| 1 | Hotkey | Ctrl+Shift+Space, Alt+Space, custom | Ctrl+Shift+Space |
| 2 | Storage location | ~/.prompter/, ~/Documents/Prompter/ | ~/.prompter/ |
| 3 | Auto-paste | Always, Never, Configurable | Configurable (default: on) |
| 4 | External editor | Support VS Code editing? | Yes (file watcher) |
| 5 | Cloud sync | Design for OneDrive/iCloud? | Yes (plain files) |

---

# PART 6: STATUS TRACKING

```
OVERALL PROGRESS
================

Phase 1: Foundation
  [ ] Project initialized (npm create tauri-app)
  [ ] Dependencies installed
  [ ] Window config (frameless, centered)
  [ ] TypeScript types defined
  [ ] Rust module stubs created
  [ ] Mock data created
  [ ] TailwindCSS configured
  >>> CHECKPOINT: Ready for parallel? [ ]

Phase 2: Parallel Development
  [ ] Agent A (Data) complete
  [ ] Agent B (OS) complete
  [ ] Agent C (UI) complete
  >>> CHECKPOINT: All agents done? [ ]

Phase 3: Integration
  [ ] UI connected to Data layer
  [ ] UI connected to OS layer
  [ ] Hotkey wired to window
  [ ] Full flow tested
  >>> CHECKPOINT: MVP working? [ ]

Phase 4: Polish
  [ ] Markdown editor
  [ ] Folder organization
  [ ] Settings panel
  [ ] Installer/packaging
```

---

## References

- [Tauri v2 Documentation](https://v2.tauri.app/)
- [Tauri Global Shortcut Plugin](https://v2.tauri.app/plugin/global-shortcut/)
- [Tauri Clipboard Plugin](https://v2.tauri.app/plugin/clipboard/)
- [window-vibrancy crate](https://github.com/tauri-apps/window-vibrancy)
- [windows-rs crate](https://github.com/microsoft/windows-rs)
- [Original YouTube Video](https://www.youtube.com/watch?v=w_wbKLOjqeE)

# Promptlight Editor - Reference Screenshots

Screenshots from YouTube video: "I Tried to Build a Prompt Manager in One Hour - Chaos Ensued"
Source: https://www.youtube.com/watch?v=w_wbKLOjqeE

## Screenshot Descriptions

### 1. spotlight-window.png
Main Spotlight-style search window showing:
- Search input: "Search prompts..."
- Results list with icons, names, descriptions, folder tags, and usage counts
- Keyboard hints at bottom: Navigate, Tab promote, Enter paste, Edit, New, Esc dismiss
- Prompts shown: Meeting notes, Meeting Engagement Report, Video Grader, What Should I Watch Tonight?, 48 Hours in AI

### 2. editor-basic.png
Basic editor view (no sidebar) showing:
- Header: Prompt name "Meeting notes" with Copy, Paste, Delete, Save buttons
- Name field with icon picker button (green people icon)
- Folder dropdown: "meeting"
- Description field: "Get notes from a meeting transcript"
- Content (Markdown) textarea with full prompt content

### 3. editor-icon-picker.png
Editor with icon picker popover open:
- Two tabs: "Icon" and "Color"
- Grid of icons (6x6) in green color
- Icons include: document, code, list, text, arrows, brackets, checkmarks, mail, rocket, etc.

### 4. editor-color-picker.png
Editor with color picker popover open:
- Two tabs: "Icon" and "Color"
- Color palette grid (8x4) with various colors
- Colors: reds, oranges, yellows, greens, cyans, blues, purples, pinks

### 5. editor-folder-dropdown.png
Editor with folder dropdown expanded:
- Folders listed: development, writing, communication, creative, uncategorized, code, images, video, meeting (checked), news, shows
- "+ New Folder..." option at bottom (highlighted blue)

### 6. editor-with-sidebar.png
Full editor view with sidebar:
- Left sidebar:
  - "Prompts" header with "+ New" button
  - Filter prompts search box
  - "+ Add Folder" button
  - Folder tree with expand/collapse:
    - Development (4): Explain Code (22), Write Tests (14), Fix Error (16), Video Grader (1)
    - Writing (2): Summarize (7), Improve Writing (1)
    - Communication (1): Email Reply (shown in main editor)
    - Creative (1): Brainstorm Ideas (1)
    - Uncategorized (1): Dogs Facts (19)
    - Code (1): Code Review (10)
- Main editor panel showing "Email Reply" prompt

### 7. editor-prompt-list.png
Editor showing different prompt selected:
- Sidebar visible with folder structure
- Multiple folders expanded showing usage counts
- Meeting folder: Meeting Engagement R... (3), Meeting notes (1)
- News folder: 48 Hours in AI (1)

### 8. context-modal-simple.png
Variable context modal (simple, no variables):
- Prompt badge: "48 Hours in AI"
- Input field: "Add context..."
- Hint text: "Press Enter to paste"
- Footer hints: Enter paste, Esc cancel

### 9. spotlight-search-filtered.png
Spotlight window with search query:
- Search input: "news"
- Filtered result: "48 Hours in AI" - Latest news in AI
- Keyboard hints visible at bottom

### 10. context-modal-with-input.png
Variable context modal with user input:
- Prompt badge: "48 Hours in AI"
- Input filled: "make sure it's only good news"
- Hint text: "Press Enter to paste"

## Features Comparison (Promptlight vs Our Implementation)

| Feature | Promptlight | Prompter (Ours) | Status |
|---------|-------------|-----------------|--------|
| Spotlight search | Yes | Yes | Done |
| Keyboard navigation | Yes | Yes | Done |
| Folder organization | Yes | Yes | Done |
| Icon picker | Yes | Yes | Done |
| Color picker | Yes | Yes | Done |
| Usage count display | Yes | Yes | Done |
| Sidebar with folder tree | Yes | Partial | Missing sidebar navigation |
| Filter prompts in sidebar | Yes | No | Missing |
| "+ New" button in sidebar | Yes | No | Missing (tray menu only) |
| "+ Add Folder" in sidebar | Yes | No | Missing |
| Expand/collapse folders | Yes | No | Missing |
| Edit prompt from spotlight | Yes (edit hint) | No | Missing |
| Context modal | Yes | Yes | Done |
| Copy/Paste/Delete/Save buttons | Yes | Partial | Missing Copy/Paste/Delete |

## Priority Features to Add

1. **Sidebar navigation in editor** - Folder tree with prompts list
2. **Edit from spotlight** - Press 'e' or similar to edit selected prompt
3. **Copy/Paste/Delete buttons** - In editor header
4. **Filter prompts** - Search within sidebar
5. **Add folder inline** - From sidebar or folder dropdown

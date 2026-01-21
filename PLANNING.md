# Pinned Tabs Customizer — Planning Document

## Decisions Made ✅

| Question | Decision |
|----------|----------|
| Display when shrunk | Icon if assigned, otherwise file icon. Default icon fills in for unassigned files (if enabled) |
| Icons when NOT shrunk | No — only visible when shrunk |
| Width range | 40–120px |
| Folder matching | Includes subfolders (user picks specific path to narrow scope) |
| Regex/Exact scope | Matches file NAME only (not path), across entire vault |
| Right-click action | Adds "Exact" mapping to settings list (editable in settings) |
| Right-click menu on | All files |
| Nested settings | Yes — show/hide based on parent toggle |
| Icon field content | Any text — emojis, symbols, letters, anything |

---

## Features Specification

### 1. Shrink Pinned Tabs (Global Toggle)

- **Default:** OFF — pinned tabs look completely normal
- **When ON:** Pinned tabs shrink to configurable width (40–120px)
- Shrunk tab shows:
  1. Custom icon (if assigned via frontmatter or mapping)
  2. Default icon (if "show default icon" is ON and no custom icon)
  3. File icon (fallback)

### 2. Default Icon

- Only visible when "Shrink pinned tabs" is ON
- **Toggle:** Show default icon on all pinned tabs
- **Input:** Any text — emoji, symbol, letters (e.g., 📌 or "P" or ⚡)
- Only applies to files WITHOUT a custom icon assigned

### 3. Icon Assignment Priority

```
1. Frontmatter      →  pinned-icon: 🏠      (highest priority)
2. Mappings         →  Settings rules        (first match wins)
```

**Note:** The icon field accepts ANY text — emojis, symbols, letters, etc.

#### Frontmatter (Priority 1)
```yaml
---
pinned-icon: 🏠
---
```
- Property name customizable (default: `pinned-icon`)
- Empty value = no icon (falls through to mappings)

#### Mappings (Priority 2)

All mappings live in the same settings list. Right-click adds an "Exact" entry here.

| Type | Match Against | Example |
|------|---------------|---------|
| Exact | File name exactly | `Home` → 🏠 |
| Folder | Full path prefix | `Projects/` → 📁 (includes subfolders) |
| Starts with | Beginning of file name | `Meeting` → 👥 |
| Ends with | End of file name | `-notes` → 📝 |
| Contains | Text anywhere in name | `archive` → 🗃️ |
| Regex | Regular expression | `^\d{4}-\d{2}-\d{2}$` → 📅 |

- Ordered list — **first match wins**
- User can reorder via drag-and-drop
- Right-click on file → adds "Exact" mapping → editable in settings
- If file is renamed, the exact mapping no longer matches (expected behavior)

---

## Settings UI

```
┌─────────────────────────────────────────────────────────┐
│ PINNED TABS CUSTOMIZER                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─ Appearance ─────────────────────────────────────────┐│
│ │                                                      ││
│ │ [○] Shrink all pinned tabs                          ││
│ │     ↳ Width  [====●======] 60px                     ││
│ │     ↳ [○] Show default icon                         ││
│ │           ↳ Icon [📌     ] ← text input             ││
│ │                                                      ││
│ └──────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─ Icon Sources ───────────────────────────────────────┐│
│ │                                                      ││
│ │ [●] Read icon from frontmatter                      ││
│ │     ↳ Property name [pinned-icon     ]              ││
│ │                                                      ││
│ └──────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─ Icon Mappings ──────────────────────────────────────┐│
│ │                                                      ││
│ │ First match wins. Drag to reorder.                  ││
│ │ Right-click on files adds "Exact" mappings here.    ││
│ │                                                      ││
│ │ ┌────────────────────────────────────────────┐      ││
│ │ │ ≡  Exact   [Home          ] → [🏠  ]  [🗑] │      ││
│ │ └────────────────────────────────────────────┘      ││
│ │ ┌────────────────────────────────────────────┐      ││
│ │ │ ≡  Folder  [Projects/     ] → [📁  ]  [🗑] │      ││
│ │ └────────────────────────────────────────────┘      ││
│ │ ┌────────────────────────────────────────────┐      ││
│ │ │ ≡  Regex   [^\d{4}-\d{2}  ] → [📅  ]  [🗑] │      ││
│ │ └────────────────────────────────────────────┘      ││
│ │                                                      ││
│ │ [+ Add mapping]                                      ││
│ │                                                      ││
│ └──────────────────────────────────────────────────────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Data Structure

```typescript
interface PinnedTabsCustomizerSettings {
  // Appearance
  shrinkPinnedTabs: boolean;        // default: false
  pinnedTabWidth: number;           // default: 40, range: 40-120
  showDefaultIcon: boolean;         // default: false
  defaultIcon: string;              // default: "📌"
  
  // Frontmatter
  enableFrontmatter: boolean;       // default: true
  frontmatterProperty: string;      // default: "pinned-icon"
  
  // Mappings (includes right-click additions)
  iconMappings: IconMapping[];      // default: []
}

interface IconMapping {
  type: 'exact' | 'folder' | 'regex';
  match: string;
  icon: string;  // any text: emoji, symbol, letters, etc.
}
```

---

## Implementation Phases

### Phase 1: Core Settings Refactor ✅ COMPLETE
- [x] Update settings interface with all fields
- [x] Add "Shrink pinned tabs" toggle (default OFF)
- [x] Nested slider (only shows when shrink is ON)
- [x] Make CSS apply only when shrink is ON (via `body.pinned-tabs-shrink` class)

### Phase 2: Default Icon ✅ COMPLETE
- [x] Add "Show default icon" toggle (nested under shrink)
- [x] Add text input for default icon
- [x] Display default icon in shrunk tabs (when no custom icon)
- [x] Added reset button for width slider
- [x] Increased max width to 200px

### Phase 3: Frontmatter Support ✅ COMPLETE
- [x] Add frontmatter toggle + property name setting
- [x] Read icon from file frontmatter when tab is pinned
- [x] Update display when frontmatter changes (via metadataCache event)

### Phase 4: Icon Mappings UI ✅ COMPLETE
- [x] Create mapping list UI in settings
- [x] Add/edit/delete mappings
- [x] Move up/down buttons for reordering
- [x] Exact/folder/regex matching logic

**Polish items completed:**
- [x] Improved visual design of mapping items (card-style, better spacing)
- [x] Added autocomplete for folder/file picking (native Obsidian suggest)
- [x] Modal-based UI for adding/editing mappings (file picker, folder picker, regex modal)
- [x] Quick emoji picker with common emojis
- [x] Type badges for folder/regex mappings
- [x] Drag-and-drop reordering for mappings (replaced up/down buttons)
- [x] Instant update on pin/unpin (MutationObserver + additional event listeners)
- [x] Native Obsidian pin icon when default icon is empty
- [x] Modularized codebase into separate files
- [x] Enhanced icon picker with categories, search, Lucide icons, and recent icons
- [x] Enhanced pattern editor with:
  - Simple match types (starts with, ends with, contains) for non-programmers
  - Quick presets for common patterns (daily notes, weekly notes, etc.)
  - Live preview showing which files match the pattern
  - Test input field to check if a specific filename matches

### Phase 5: Right-Click & Commands ✅ COMPLETE
- [x] Add context menu item to all files
- [x] Create icon input modal
- [x] Add "Exact" mapping to settings when used
- [x] Add command palette action for current file

---

## Technical Notes

### How to Display Emoji in Tab

The tab DOM structure:
```html
<div class="workspace-tab-header">
  <div class="workspace-tab-header-inner">
    <div class="workspace-tab-header-inner-icon"><!-- file icon SVG --></div>
    <div class="workspace-tab-header-inner-title">Note1</div>
    ...
  </div>
</div>
```

**Approach:** Replace the icon content OR inject emoji before/instead of icon.

Need to:
1. Watch for pinned tabs (workspace events)
2. Resolve emoji for each pinned file (priority chain)
3. Inject emoji into tab DOM
4. Clean up when unpinned/closed

### Workspace Events to Watch
- `layout-change` — tabs opened/closed/moved
- `file-open` — new file opened
- `active-leaf-change` — active tab changed

---

## Status: All Phases & Polish Complete ✅

All features implemented:
- Shrink pinned tabs with configurable width
- Default icon support
- Frontmatter icon support
- Icon mappings (exact/folder/regex)
- Right-click & command palette integration
- Autocomplete for file/folder selection
- Polished settings UI

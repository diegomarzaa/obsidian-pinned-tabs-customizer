# Pinned Tabs Customizer — Planning Document

## Decisions Made ✅

| Question | Decision |
|----------|----------|
| Display when shrunk | Emoji if assigned, otherwise file icon. Default emoji fills in for unassigned files (if enabled) |
| Emojis when NOT shrunk | No — only visible when shrunk |
| Width range | 40–120px |
| Folder matching | Includes subfolders (user picks specific path to narrow scope) |
| Regex/Exact scope | Matches file NAME only (not path), across entire vault |
| Right-click saves to | Plugin data, stored by **file name** (not path) — survives file moves |
| Right-click menu on | All files |
| Nested settings | Yes — show/hide based on parent toggle |

---

## Features Specification

### 1. Shrink Pinned Tabs (Global Toggle)

- **Default:** OFF — pinned tabs look completely normal
- **When ON:** Pinned tabs shrink to configurable width (40–120px)
- Shrunk tab shows:
  1. Custom emoji (if assigned via any method)
  2. Default emoji (if "show default emoji" is ON and no custom emoji)
  3. File icon (fallback)

### 2. Default Emoji

- Only visible when "Shrink pinned tabs" is ON
- **Toggle:** Show default emoji on all pinned tabs
- **Picker:** Choose the default emoji (e.g., 📌)
- Only applies to files WITHOUT a custom emoji assigned

### 3. Emoji Assignment Priority

```
1. Frontmatter      →  pinned-emoji: 🏠     (highest priority)
2. Emoji Mappings   →  Settings rules        (first match wins)
3. Right-click      →  Plugin data by NAME   (lowest priority)
```

#### Frontmatter
```yaml
---
pinned-emoji: 🏠
---
```
- Property name customizable (default: `pinned-emoji`)
- Empty value = no emoji (falls through to next priority)

#### Emoji Mappings (Settings)
| Type | Match Against | Example |
|------|---------------|---------|
| Exact | File name (without .md) | `Home` → 🏠 |
| Folder | Full path prefix | `Projects/` → 📁 (includes subfolders) |
| Regex | File name (without .md) | `^\d{4}-\d{2}-\d{2}$` → 📅 |

- Ordered list — first match wins
- User can reorder via drag-and-drop

#### Right-Click Assignment
- Stored in plugin data by **file name only**
- Example: `"Home": "🏠"` (not `"Projects/Home.md": "🏠"`)
- Survives file moves/renames... wait, if stored by name:
  - ✅ Survives moving to different folder
  - ❌ Lost if file is renamed

**Note:** Should we store by name or offer both? Or is name-only the intended behavior?

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
│ │     ↳ [○] Show default emoji                        ││
│ │           ↳ Emoji [📌] ← picker                     ││
│ │                                                      ││
│ └──────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─ Emoji Sources ──────────────────────────────────────┐│
│ │                                                      ││
│ │ [●] Read emoji from frontmatter                     ││
│ │     ↳ Property name [pinned-emoji    ]              ││
│ │                                                      ││
│ └──────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─ Emoji Mappings ─────────────────────────────────────┐│
│ │                                                      ││
│ │ First match wins. Drag to reorder.                  ││
│ │                                                      ││
│ │ ┌────────────────────────────────────────────┐      ││
│ │ │ ≡  Exact   [Home          ] → [🏠]    [🗑] │      ││
│ │ └────────────────────────────────────────────┘      ││
│ │ ┌────────────────────────────────────────────┐      ││
│ │ │ ≡  Folder  [Projects/     ] → [📁]    [🗑] │      ││
│ │ └────────────────────────────────────────────┘      ││
│ │ ┌────────────────────────────────────────────┐      ││
│ │ │ ≡  Regex   [^\d{4}-\d{2}  ] → [📅]    [🗑] │      ││
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
  showDefaultEmoji: boolean;        // default: false
  defaultEmoji: string;             // default: "📌"
  
  // Frontmatter
  enableFrontmatter: boolean;       // default: true
  frontmatterProperty: string;      // default: "pinned-emoji"
  
  // Mappings
  emojiMappings: EmojiMapping[];    // default: []
  
  // Right-click assignments (by file name)
  fileEmojis: Record<string, string>;  // e.g., { "Home": "🏠" }
}

interface EmojiMapping {
  type: 'exact' | 'folder' | 'regex';
  match: string;
  emoji: string;
}
```

---

## Implementation Phases

### Phase 1: Core Settings Refactor ← START HERE
- [ ] Update settings interface with all fields
- [ ] Add "Shrink pinned tabs" toggle (default OFF)
- [ ] Nested slider (only shows when shrink is ON)
- [ ] Make CSS apply only when shrink is ON

### Phase 2: Default Emoji
- [ ] Add "Show default emoji" toggle (nested under shrink)
- [ ] Add emoji picker for default emoji
- [ ] Display default emoji in shrunk tabs (when no custom emoji)

### Phase 3: Frontmatter Support
- [ ] Add frontmatter toggle + property name setting
- [ ] Read emoji from file frontmatter when tab is pinned
- [ ] Update display when frontmatter changes

### Phase 4: Emoji Mappings UI
- [ ] Create mapping list UI in settings
- [ ] Add/edit/delete mappings
- [ ] Drag-to-reorder functionality
- [ ] Exact/folder/regex matching logic

### Phase 5: Right-Click & Commands
- [ ] Add context menu item to all files
- [ ] Create emoji picker modal
- [ ] Store emoji by file name in plugin data
- [ ] Add command palette action

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

## Questions Remaining

1. **Right-click by name:** If file `Home.md` is renamed to `Dashboard.md`, the emoji is lost. Is this acceptable? Or should we also store by path as backup?

---

## Ready to Start?

Phase 1 is ready to implement. Shall I begin with the settings refactor?

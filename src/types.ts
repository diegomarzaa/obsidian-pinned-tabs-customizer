/** --------------------------------
*  INTERFACES & DEFAULTS
* -------------------------------- */
interface LabelEmojiPair {
  label: string; // The pinned tab's aria-label or file name
  emoji: string; // The emoji to display for this label
}

interface PinnedEmojiSettings {
  pinnedTabSize: number;          // Max width in px for pinned tabs
  labelEmojiMap: LabelEmojiPair[]; // Collection of file→emoji mappings
}

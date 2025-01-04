import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  FuzzySuggestModal,
  TFile,
  Notice,
  Menu,
  Modal,
  TextComponent,
} from 'obsidian';

import EMOJI_DATA from "./data/emojis.json";

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

const DEFAULT_SETTINGS: PinnedEmojiSettings = {
  pinnedTabSize: 33,
  labelEmojiMap: [
    { label: 'Home',   emoji: '🏠' },
    { label: 'Tasks',   emoji: '📋' },
    { label: 'Books',     emoji: '📖' },
  ],
};

const DEFAULT_PIN_EMOJI = '📌'; // Default emoji for unmapped pinned tabs

/** 
* A short list of popular emojis for quick selection.
* You can add, remove, or replace these with your own.
*/
const COMMON_EMOJIS: Record<string, string> = {
  '❤️ Heart': '❤️',
  '🤖 Robot': '🤖',
  '🔥 Fire': '🔥',
  '📚 Books': '📚',
  '🎉 Party': '🎉',
  '✏️  Pencil': '✏️',
  '🌟 Star': '🌟',
  '💡 Idea': '💡',
  '✅ Check': '✅',
  '📌 Pin': '📌',
  '⚡ Lightning': '⚡',
};

const EMOJI_LIST: { emoji: string; name: string; category: string }[] = [
    { emoji: "😀", name: "Grinning Face", category: "Smileys & Emotion" },
    { emoji: "🔥", name: "Fire", category: "Objects" },
    { emoji: "🎉", name: "Party Popper", category: "Activities" },
    { emoji: "📚", name: "Books", category: "Objects" },
    { emoji: "❤️", name: "Red Heart", category: "Smileys & Emotion" },
    { emoji: "📖", name: "Open Book", category: "Objects" },
    { emoji: "✅", name: "Check Mark", category: "Symbols" },
    { emoji: "🌟", name: "Star", category: "Nature" },
    { emoji: "💡", name: "Light Bulb", category: "Objects" },
    { emoji: "📌", name: "Pushpin", category: "Objects" },
    // Add more emojis here...
  ];

/** --------------------------------
*  MAIN PLUGIN CLASS
* -------------------------------- */
export default class PinnedEmojiPlugin extends Plugin {
  settings: PinnedEmojiSettings;
  styleEl: HTMLStyleElement;
  
  async onload() {
    console.log('Pinned Emoji Plugin loading...');
    await this.loadSettings();
    
    // Create a <style> element for our dynamic CSS.
    this.styleEl = document.createElement('style');
    document.head.appendChild(this.styleEl);
    
    // Generate CSS based on current settings.
    this.generateDynamicCSS();
    
    // Register the plugin's settings tab.
    this.addSettingTab(new PinnedEmojiSettingTab(this.app, this));

    // Register context menu for tabs
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        menu.addItem((item) => {
          item
            .setTitle('Customize Pin')
            .setIcon('edit')
            .onClick(() => {
              const label = file.name.replace(/\.md$/, ''); // Get the tab title
              new EmojiPickerModal(this.app, label, async (emoji) => {
                // Save the new emoji
                const existing = this.settings.labelEmojiMap.find(
                  (entry) => entry.label === label
                );
                if (existing) {
                  existing.emoji = emoji;
                } else {
                  this.settings.labelEmojiMap.push({ label, emoji });
                }
                await this.saveSettings();
                this.generateDynamicCSS();
                new Notice(`Pinned emoji for "${label}" set to ${emoji}`);
              }).open();
            });
        });
      })
    );
  }
  
  onunload() {
    console.log('Pinned Emoji Plugin unloading...');
    this.styleEl?.remove();
  }
  
  /**
  * Load user settings from disk or use defaults.
  */
  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }
  
  /**
  * Save user settings and regenerate dynamic CSS.
  */
  async saveSettings() {
    await this.saveData(this.settings);
    this.generateDynamicCSS();
  }
  
  
  
  /**
  * Build CSS that customizes pinned tabs:
  * - Sets pinned tab width.
  * - Replaces pinned tab labels with user-chosen emojis.
  * - Adds default "📌" emoji for unmapped pinned tabs.
  */
  generateDynamicCSS() {
    let css = `
      /* Pinned Tab Customizations for Main Bar */
      .workspace-tabs .workspace-tab-header:has(.mod-pinned) {
        max-width: ${this.settings.pinnedTabSize}px !important;
      }
  
      .workspace-tabs .workspace-tab-header:has(.mod-pinned) .workspace-tab-header-inner-title {
        text-overflow: clip !important;
        visibility: hidden !important;
        position: relative;
      }
  
      .workspace-tabs .workspace-tab-header:has(.mod-pinned) .workspace-tab-header-status-container {
        display: none !important; /* Hide pinned icon in the main bar */
      }
  
      .workspace-tabs .workspace-tab-header:has(.mod-pinned) .workspace-tab-header-inner-title::after {
        visibility: visible !important;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.3em;
        line-height: 1;
        display: block;
        color: inherit;
        content: "${DEFAULT_PIN_EMOJI}"; /* Default to pin emoji */
      }

      /* Center the emoji in the tab */
      .workspace-tabs .workspace-tab-header-inner {
        padding-inline-end: 8px;
        padding-inline-start: 8px;
      }

  
      /* Sidebar Customizations */
      .workspace-split.mod-horizontal .workspace-tab-header:has(.mod-pinned) {
        max-width: 48px !important; /* Fixed width for sidebar pinned tabs */
      }

      .workspace-split.mod-horizontal .workspace-tab-header .workspace-tab-header-status-container {
        display: flex !important; /* Show pinned icon in the sidebar */
      }
    `;
    
    // Append rules for each label → emoji mapping
    for (const pair of this.settings.labelEmojiMap) {
      const safeLabel = pair.label.replace(/"/g, '\\"');
      css += `
        /* Custom emoji for pinned tabs */
        .workspace-tabs .workspace-tab-header:has(.mod-pinned)[aria-label="${safeLabel}"]
          .workspace-tab-header-inner-title::after {
          content: "${pair.emoji}";
        }
  
        /* Custom emoji for sidebar icons */
        .workspace-split.mod-horizontal .workspace-tab-header[aria-label="${safeLabel}"] .workspace-tab-header-inner-icon svg {
          display: none;
        }
  
        .workspace-split.mod-horizontal .workspace-tab-header[aria-label="${safeLabel}"] .workspace-tab-header-inner-icon::before {
          content: "${pair.emoji}";
          font-size: 1.2em;
          display: block;
          line-height: 1;
          text-align: center;
          margin: 0 auto;
        }
      `;
    }
    
    // Apply the updated CSS to the <style> element
    this.styleEl.textContent = css;
  }
}

/** --------------------------------
 *  EMOJI PICKER MODAL
 * --------------------------------
 * A simple modal for selecting or typing an emoji.
 */

export class EmojiPickerModal extends Modal {
    private onSubmit: (emoji: string) => void;
    private label: string;
    private currentCategory: string = "Smileys & Emotion";
    private currentSubCategory: string | null = null;
    private searchQuery: string = ""; // Track the current search query
  
    constructor(app: App, label: string, onSubmit: (emoji: string) => void) {
      super(app);
      this.label = label;
      this.onSubmit = onSubmit;
    }
  
    onOpen() {
      const { contentEl } = this;
  
      contentEl.empty(); // Clear existing content
      contentEl.createEl("h2", { text: `Customize Pin for "${this.label}"` });
  
      // Preview element
      const previewEl = contentEl.createEl("div", { cls: "emoji-preview" });
      // (Removed inline styles — now in CSS)

      // Search input
      const searchInput = contentEl.createEl("input", {
        type: "text",
        placeholder: "Search emojis globally...",
        cls: "emoji-search-input", // class for CSS
      });
      // (Removed inline styles — now in CSS)
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
        this.renderEmojiList(previewEl, emojiContainer); // Refresh the emoji list
      });
  
      // Category tabs
      const categoryTabs = contentEl.createEl("div", { cls: "category-tabs" });
      // (Removed inline styles — now in CSS)
      this.renderCategoryTabs(categoryTabs);
  
      // Subcategory tabs
      const subCategoryTabs = contentEl.createEl("div", { cls: "subcategory-tabs" });
      // (Removed inline styles — now in CSS)
      this.renderSubCategoryTabs(subCategoryTabs);
  
      // Emoji container
      const emojiContainer = contentEl.createEl("div", { cls: "emoji-container" });
      // (Removed inline styles — now in CSS)
      this.renderEmojiList(previewEl, emojiContainer);
  
      // Button container
      const buttonContainer = contentEl.createEl("div", { cls: "button-container" });
      // (Removed inline styles — now in CSS)
  
      // Save Button
      const saveButton = buttonContainer.createEl("button", {
        text: "Save",
        cls: "emoji-save-button",
      });
      saveButton.onclick = () => {
        const selectedEmoji = previewEl.textContent?.trim();
        if (!selectedEmoji) {
          new Notice("Please select an emoji.");
          return;
        }
        this.onSubmit(selectedEmoji);
        this.close();
      };
  
      const resetButton = buttonContainer.createEl("button", {
        text: "Reset to Default",
        cls: "emoji-reset-button",
      });
      resetButton.onclick = () => {
        this.onSubmit("📌");
        this.close();
      };
  
      // Consolidated styles
      contentEl.createEl("style", {
        text: `
          /* Layout and utility classes for EmojiPickerModal */
          .emoji-preview {
            font-size: 2.5em;
            text-align: center;
            margin: 10px 0;
            border: 1px solid var(--background-modifier-border);
            padding: 10px;
            border-radius: 8px;
          }

          .emoji-search-input {
            width: 100%;
            margin-bottom: 10px;
          }

          .category-tabs,
          .subcategory-tabs {
            display: flex;
            gap: 10px;
            overflow-x: auto;
          }
          .subcategory-tabs {
            margin-bottom: 10px;
          }

          .emoji-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
            gap: 10px;
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            padding: 10px;
          }

          .button-container {
            display: flex;
            justify-content: space-between;
          }

          .emoji-card {
            font-size: 1.5em;
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            text-align: center;
            padding: 8px;
            cursor: pointer;
          }
          .emoji-card:hover {
            background: var(--background-modifier-hover);
          }

          .emoji-save-button {
            background: var(--interactive-accent);
            color: var(--text-on-accent);
            padding: 10px 15px;
            border-radius: 8px;
            font-weight: bold;
            border: none;
            cursor: pointer;
          }
          .emoji-save-button:hover {
            background: var(--interactive-accent-hover);
          }
          .emoji-reset-button {
            padding: 10px 15px;
            border-radius: 8px;
            border: 1px solid var(--background-modifier-border);
            cursor: pointer;
          }

          .category-tab.active-tab,
          .subcategory-tab.active-tab {
            background: var(--interactive-accent-hover);
            color: var(--text-on-accent);
          }
        `,
      });
    }
  
    renderCategoryTabs(categoryTabs: HTMLElement) {
      categoryTabs.empty();
  
      Object.keys(EMOJI_DATA.emojis).forEach((category) => {
        const tab = categoryTabs.createEl("button", { text: category, cls: "category-tab" });
        if (this.currentCategory === category) tab.addClass("active-tab");
  
        tab.onclick = () => {
          this.currentCategory = category;
          this.currentSubCategory = null; // Reset subcategory
          this.searchQuery = ""; // Clear the search query
          this.onOpen(); // Refresh the modal
        };
      });
    }
  
    renderSubCategoryTabs(subCategoryTabs: HTMLElement) {
      subCategoryTabs.empty();
  
      const subCategories = EMOJI_DATA.emojis[this.currentCategory];
      Object.keys(subCategories).forEach((subCategory) => {
        const tab = subCategoryTabs.createEl("button", {
          text: subCategory.replace(/-/g, " "),
          cls: "subcategory-tab",
        });
        if (this.currentSubCategory === subCategory) tab.addClass("active-tab");
  
        tab.onclick = () => {
          this.currentSubCategory = subCategory;
          this.searchQuery = ""; // Clear the search query
          this.onOpen(); // Refresh the modal
        };
      });
    }
  
    renderEmojiList(previewEl: HTMLElement, emojiContainer: HTMLElement) {
      emojiContainer.empty();
  
      const emojis = this.searchQuery
        ? Object.values(EMOJI_DATA.emojis)
            .flatMap((category) => Object.values(category).flat())
            .filter((emoji: { emoji: string; name: string }) =>
              emoji.name.toLowerCase().includes(this.searchQuery) || emoji.emoji.includes(this.searchQuery)
            )
        : this.currentSubCategory
        ? EMOJI_DATA.emojis[this.currentCategory][this.currentSubCategory]
        : Object.values(EMOJI_DATA.emojis[this.currentCategory]).flat();
  
      if (emojis.length === 0) {
        emojiContainer.createEl("div", { text: "No emojis found." });
        return;
      }
  
      emojis.forEach((emoji: { emoji: string; name: string }) => {
        const emojiCard = emojiContainer.createEl("div", {
          text: emoji.emoji,
          cls: "emoji-card",
        });
        emojiCard.title = emoji.name;
  
        emojiCard.onclick = () => {
          previewEl.textContent = emoji.emoji;
        };
      });
    }
  
    onClose() {
      this.contentEl.empty();
    }
  }
  

/** --------------------------------
*  FILE PICKER MODAL
* --------------------------------
* A fuzzy search for choosing a file from the vault.
*/
class FilePickerModal extends FuzzySuggestModal<TFile> {
  onChooseItemCallback: (file: TFile) => void;
  
  constructor(app: App, onChooseItemCallback: (file: TFile) => void) {
    super(app);
    this.onChooseItemCallback = onChooseItemCallback;
  }
  
  getItems(): TFile[] {
    return this.app.vault.getFiles();
  }
  
  getItemText(item: TFile): string {
    return item.path;
  }
  
  onChooseItem(item: TFile) {
    this.onChooseItemCallback(item);
  }
}

/** --------------------------------
*  SETTINGS TAB
* --------------------------------
* A single settings tab for controlling:
* - pinned tab width
* - file → emoji mappings
*/


export class PinnedEmojiSettingTab extends PluginSettingTab {
    plugin: PinnedEmojiPlugin;
  
    constructor(app: App, plugin: PinnedEmojiPlugin) {
      super(app, plugin);
      this.plugin = plugin;
    }
  
    display(): void {
      const { containerEl } = this;
      containerEl.empty();
  
      containerEl.createEl("h2", { text: "Pinned Tab Customization Settings" });
  
      new Setting(containerEl)
        .setName("Pinned Tab Width")
        .setDesc("Set the width of pinned tabs in pixels.")
        .addSlider((slider) =>
          slider
            .setLimits(20, 80, 1)
            .setValue(this.plugin.settings.pinnedTabSize)
            .onChange(async (value) => {
              this.plugin.settings.pinnedTabSize = value;
              await this.plugin.saveSettings();
            })
        );
  
      const mappingContainer = containerEl.createEl("div", { cls: "mapping-container" });
  
      this.plugin.settings.labelEmojiMap.forEach((mapping, index) => {
        const card = mappingContainer.createEl("div", { cls: "mapping-card" });
  
        const labelInput = card.createEl("input", {
          type: "text",
          value: mapping.label,
          cls: "label-input",
        });
        labelInput.onblur = async () => {
          mapping.label = labelInput.value;
          await this.plugin.saveSettings();
        };
  
        const emojiButton = card.createEl("button", { text: mapping.emoji || "Pick Emoji", cls: "emoji-button" });
        emojiButton.onclick = () => {
          new EmojiPickerModal(this.app, mapping.label, async (emoji) => {
            mapping.emoji = emoji;
            emojiButton.textContent = emoji;
            await this.plugin.saveSettings();
          }).open();
        };
  
        const fileButton = card.createEl("button", { text: "Pick File", cls: "file-button" });
        fileButton.onclick = () => {
          new FilePickerModal(this.app, async (file) => {
            mapping.label = file.name.replace(/\.md$/, "");
            labelInput.value = mapping.label;
            await this.plugin.saveSettings();
          }).open();
        };
  
        const deleteButton = card.createEl("button", { text: "Delete", cls: "delete-button" });
        deleteButton.onclick = async () => {
          this.plugin.settings.labelEmojiMap.splice(index, 1);
          await this.plugin.saveSettings();
          this.display();
        };
      });
  
      new Setting(containerEl)
        .setName("Add New Mapping")
        .addButton((btn) =>
          btn.setButtonText("Add").onClick(async () => {
            this.plugin.settings.labelEmojiMap.push({ label: "New Tab", emoji: "📌" });
            await this.plugin.saveSettings();
            this.display();
          })
        );
  
      containerEl.createEl("style", {
        text: `
          .mapping-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 10px;
          }
          .mapping-card {
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          .label-input {
            width: 100%;
          }
          .emoji-button, .file-button, .delete-button {
            padding: 5px;
            border-radius: 5px;
          }
          .delete-button {
            background: var(--interactive-critical);
            color: var(--text-on-accent);
          }
        `,
      });
    }
}

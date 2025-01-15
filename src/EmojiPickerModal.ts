import { App, Modal, Notice } from 'obsidian';
import EMOJI_DATA from '../data/emojis.json'; 
import { DEFAULT_PIN_EMOJI } from './constants';

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
    contentEl.createEl("h2", { text: `Customize pin for "${this.label}"` });

    // Preview element
    const previewEl = contentEl.createEl("div", { cls: "emoji-preview" });

    // Search input
    const searchInput = contentEl.createEl("input", {
      type: "text",
      placeholder: "Search emojis globally...",
      cls: "emoji-search-input",
    });
    searchInput.addEventListener("input", (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
      this.renderEmojiList(previewEl, emojiContainer); // Refresh the emoji list
    });

    // Category tabs
    const categoryTabs = contentEl.createEl("div", { cls: "category-tabs" });
    this.renderCategoryTabs(categoryTabs);

    // Subcategory tabs
    const subCategoryTabs = contentEl.createEl("div", { cls: "subcategory-tabs" });
    this.renderSubCategoryTabs(subCategoryTabs);

    // Emoji container
    const emojiContainer = contentEl.createEl("div", { cls: "emoji-container" });
    this.renderEmojiList(previewEl, emojiContainer);

    // Button container
    const buttonContainer = contentEl.createEl("div", { cls: "button-container" });

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

    // Reset Button
    const resetButton = buttonContainer.createEl("button", {
      text: "Reset to default",
      cls: "emoji-reset-button",
    });
    resetButton.onclick = () => {
      this.onSubmit(DEFAULT_PIN_EMOJI);
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

    const categories = Object.keys(EMOJI_DATA.emojis);
    categories.forEach((category) => {
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

    const base = Object.values(EMOJI_DATA.emojis[this.currentCategory]);
    const emojis = this.searchQuery
      ? Object.values(EMOJI_DATA.emojis)
          .flatMap((cat) => Object.values(cat).flat())
          .filter((emoji: { emoji: string; name: string }) =>
            emoji.name.toLowerCase().includes(this.searchQuery) ||
            emoji.emoji.includes(this.searchQuery)
          )
      : this.currentSubCategory
      ? EMOJI_DATA.emojis[this.currentCategory][this.currentSubCategory]
      : base.flat();

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

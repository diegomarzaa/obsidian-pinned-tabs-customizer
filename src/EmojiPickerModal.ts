import { App, Modal, Notice } from 'obsidian';
import EMOJI_DATA from '../data/emojis.json'; 
import { DEFAULT_PIN_EMOJI } from './constants';

export class EmojiPickerModal extends Modal {
	private onSubmit: (emoji: string) => void;
	private label: string;
	private currentCategory: string = "Smileys & Emotion";
	private currentSubCategory: string | null = null;
	private searchQuery: string = "";

	constructor(app: App, label: string, onSubmit: (emoji: string) => void) {
		super(app);
		this.label = label;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl("h2", { text: `Customize pin for "${this.label}"` });

		const previewEl = contentEl.createEl("div", { cls: "emoji-preview" });
		const searchInput = contentEl.createEl("input", {
			type: "text",
			placeholder: "Search emojis globally...",
			cls: "emoji-search-input",
		});
		searchInput.addEventListener("input", (e) => {
			this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
			this.renderEmojiList(previewEl, emojiContainer);
		});

		const categoryTabs = contentEl.createEl("div", { cls: "category-tabs" });
		this.renderCategoryTabs(categoryTabs);

		const subCategoryTabs = contentEl.createEl("div", { cls: "subcategory-tabs" });
		this.renderSubCategoryTabs(subCategoryTabs);

		const emojiContainer = contentEl.createEl("div", { cls: "emoji-container" });
		this.renderEmojiList(previewEl, emojiContainer);

		const buttonContainer = contentEl.createEl("div", { cls: "button-container" });
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
			text: "Reset to default",
			cls: "emoji-reset-button",
		});
		resetButton.onclick = () => {
			this.onSubmit(DEFAULT_PIN_EMOJI);
			this.close();
		};
	}

	renderCategoryTabs(categoryTabs: HTMLElement) {
		categoryTabs.empty();
		const categories = Object.keys(EMOJI_DATA.emojis);
		categories.forEach((category) => {
			const tab = categoryTabs.createEl("button", { text: category, cls: "category-tab" });
			if (this.currentCategory === category) tab.addClass("active-tab");
			tab.onclick = () => {
				this.currentCategory = category;
				this.currentSubCategory = null;
				this.searchQuery = "";
				this.onOpen();
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
				this.searchQuery = "";
				this.onOpen();
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

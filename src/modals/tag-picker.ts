import { App, FuzzySuggestModal } from 'obsidian';

/**
 * Modal to pick a tag from all tags in the vault
 */
export class TagPickerModal extends FuzzySuggestModal<string> {
	private onChoose: (tag: string) => void;
	private tags: string[];

	constructor(app: App, onChoose: (tag: string) => void) {
		super(app);
		this.onChoose = onChoose;
		this.tags = this.getAllTags();
		this.setPlaceholder('Search for a tag...');
	}

	/**
	 * Get all unique tags from the vault
	 */
	private getAllTags(): string[] {
		const tagSet = new Set<string>();
		
		// Get tags from all files via metadata cache
		const files = this.app.vault.getMarkdownFiles();
		
		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			
			// Get frontmatter tags
			if (cache?.frontmatter?.tags) {
				const fmTags = cache.frontmatter.tags as string[] | string;
				if (Array.isArray(fmTags)) {
					fmTags.forEach(tag => tagSet.add(String(tag).replace(/^#/, '')));
				} else if (typeof fmTags === 'string') {
					tagSet.add(fmTags.replace(/^#/, ''));
				}
			}
			
			// Get inline tags
			if (cache?.tags) {
				cache.tags.forEach(tagCache => {
					tagSet.add(tagCache.tag.replace(/^#/, ''));
				});
			}
		}
		
		return Array.from(tagSet).sort();
	}

	getItems(): string[] {
		return this.tags;
	}

	getItemText(tag: string): string {
		return tag;
	}

	onChooseItem(tag: string): void {
		this.onChoose(tag);
	}

	renderSuggestion(item: { item: string; match: { score: number } }, el: HTMLElement): void {
		el.createEl('span', { text: '#', cls: 'ptc-tag-hash' });
		el.createEl('span', { text: item.item });
	}
}

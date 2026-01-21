import { App, FuzzySuggestModal, TFile } from 'obsidian';

/**
 * Modal for picking a file from the vault
 */
export class FilePickerModal extends FuzzySuggestModal<TFile> {
	private onChoose: (file: TFile) => void;

	constructor(app: App, onChoose: (file: TFile) => void) {
		super(app);
		this.onChoose = onChoose;
		this.setPlaceholder('Search for a file...');
	}

	getItems(): TFile[] {
		return this.app.vault.getMarkdownFiles();
	}

	getItemText(file: TFile): string {
		return file.basename;
	}

	onChooseItem(file: TFile): void {
		this.onChoose(file);
	}

	renderSuggestion(file: { item: TFile }, el: HTMLElement): void {
		el.createEl('div', { text: file.item.basename, cls: 'suggestion-title' });
		if (file.item.parent && file.item.parent.path !== '/') {
			el.createEl('small', { text: file.item.parent.path, cls: 'suggestion-note' });
		}
	}
}

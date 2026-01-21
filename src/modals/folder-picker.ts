import { App, FuzzySuggestModal, TFolder } from 'obsidian';

/**
 * Modal for picking a folder from the vault
 */
export class FolderPickerModal extends FuzzySuggestModal<TFolder> {
	private onChoose: (folder: TFolder) => void;

	constructor(app: App, onChoose: (folder: TFolder) => void) {
		super(app);
		this.onChoose = onChoose;
		this.setPlaceholder('Search for a folder...');
	}

	getItems(): TFolder[] {
		const folders: TFolder[] = [];
		this.app.vault.getAllLoadedFiles().forEach(file => {
			if (file instanceof TFolder && file.path !== '/') {
				folders.push(file);
			}
		});
		return folders;
	}

	getItemText(folder: TFolder): string {
		return folder.path;
	}

	onChooseItem(folder: TFolder): void {
		this.onChoose(folder);
	}
}

import { App, FuzzySuggestModal, TFile } from 'obsidian';

/** --------------------------------
 *  FILE PICKER MODAL
 * --------------------------------
 * A fuzzy search for choosing a file from the vault.
 */

export class FilePickerModal extends FuzzySuggestModal<TFile> {
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

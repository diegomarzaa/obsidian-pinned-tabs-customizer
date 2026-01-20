import {App, Editor, MarkdownView, Modal, Notice, Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, PinnedTabsCustomizerSettings, PinnedTabsCustomizerSettingTab} from "./settings";

export default class PinnedTabsCustomizerPlugin extends Plugin {
	settings: PinnedTabsCustomizerSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('pin', 'Pinned tabs customizer', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('Pinned tabs customizer is active!');
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Pinned tabs customizer');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-settings',
			name: 'Open settings',
			callback: () => {
				new PinnedTabsCustomizerModal(this.app).open();
			}
		});

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'pin-current-tab',
			name: 'Pin current tab',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				new Notice('Tab pinned!');
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new PinnedTabsCustomizerSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			// Handle click events if needed
		});
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<PinnedTabsCustomizerSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class PinnedTabsCustomizerModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Pinned tabs customizer settings');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

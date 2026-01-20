import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, PinnedTabsCustomizerSettings, PinnedTabsCustomizerSettingTab} from "./settings";

export default class PinnedTabsCustomizerPlugin extends Plugin {
	settings: PinnedTabsCustomizerSettings;

	async onload() {
		await this.loadSettings();

		// Apply initial styles
		this.updateStyles();

		// Add settings tab
		this.addSettingTab(new PinnedTabsCustomizerSettingTab(this.app, this));
	}

	onunload() {
		// Clean up CSS variable
		document.body.style.removeProperty('--pinned-tab-size');
	}

	updateStyles() {
		document.body.style.setProperty('--pinned-tab-size', `${this.settings.pinnedTabSize}px`);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<PinnedTabsCustomizerSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

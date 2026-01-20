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
		// Clean up CSS variables and classes
		document.body.classList.remove('pinned-tabs-shrink');
		document.body.style.removeProperty('--pinned-tab-size');
	}

	updateStyles() {
		// Toggle shrink class based on setting
		if (this.settings.shrinkPinnedTabs) {
			document.body.classList.add('pinned-tabs-shrink');
			document.body.style.setProperty('--pinned-tab-size', `${this.settings.pinnedTabWidth}px`);
		} else {
			document.body.classList.remove('pinned-tabs-shrink');
			document.body.style.removeProperty('--pinned-tab-size');
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<PinnedTabsCustomizerSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

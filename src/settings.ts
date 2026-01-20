import {App, PluginSettingTab, Setting} from "obsidian";
import PinnedTabsCustomizerPlugin from "./main";

export interface PinnedTabsCustomizerSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: PinnedTabsCustomizerSettings = {
	mySetting: 'default'
}

export class PinnedTabsCustomizerSettingTab extends PluginSettingTab {
	plugin: PinnedTabsCustomizerPlugin;

	constructor(app: App, plugin: PinnedTabsCustomizerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Settings #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}

import {App, PluginSettingTab, Setting} from "obsidian";
import PinnedTabsCustomizerPlugin from "./main";

export interface PinnedTabsCustomizerSettings {
	pinnedTabSize: number;
}

export const DEFAULT_SETTINGS: PinnedTabsCustomizerSettings = {
	pinnedTabSize: 40
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
			.setName('Pinned tab size')
			.setDesc('Width of pinned tabs in pixels')
			.addSlider(slider => slider
				.setLimits(40, 120, 4)
				.setValue(this.plugin.settings.pinnedTabSize)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.pinnedTabSize = value;
					await this.plugin.saveSettings();
					this.plugin.updateStyles();
				}));
	}
}

import {App, PluginSettingTab, Setting} from "obsidian";
import PinnedTabsCustomizerPlugin from "./main";

// Icon mapping for custom icons per file/folder/pattern
export interface IconMapping {
	type: 'exact' | 'folder' | 'regex';
	match: string;
	icon: string;
}

export interface PinnedTabsCustomizerSettings {
	// Appearance
	shrinkPinnedTabs: boolean;
	pinnedTabWidth: number;
	showDefaultIcon: boolean;
	defaultIcon: string;

	// Frontmatter
	enableFrontmatter: boolean;
	frontmatterProperty: string;

	// Mappings
	iconMappings: IconMapping[];
}

export const DEFAULT_SETTINGS: PinnedTabsCustomizerSettings = {
	// Appearance
	shrinkPinnedTabs: false,
	pinnedTabWidth: 40,
	showDefaultIcon: false,
	defaultIcon: '📌',

	// Frontmatter
	enableFrontmatter: true,
	frontmatterProperty: 'pinned-icon',

	// Mappings
	iconMappings: []
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

		// ═══════════════════════════════════════════════════════════
		// APPEARANCE SECTION
		// ═══════════════════════════════════════════════════════════
		new Setting(containerEl)
			.setName('Appearance')
			.setHeading();

		// Shrink pinned tabs toggle
		new Setting(containerEl)
			.setName('Shrink pinned tabs')
			.setDesc('Make pinned tabs smaller, showing only the icon')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.shrinkPinnedTabs)
				.onChange(async (value) => {
					this.plugin.settings.shrinkPinnedTabs = value;
					await this.plugin.saveSettings();
					this.plugin.updateStyles();
					// Re-render to show/hide nested settings
					this.display();
				}));

		// Nested settings (only show when shrink is ON)
		if (this.plugin.settings.shrinkPinnedTabs) {
			// Width slider
			new Setting(containerEl)
				.setName('Pinned tab width')
				.setDesc('Width of shrunk pinned tabs in pixels')
				.setClass('setting-indent')
				.addSlider(slider => slider
					.setLimits(40, 120, 4)
					.setValue(this.plugin.settings.pinnedTabWidth)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.pinnedTabWidth = value;
						await this.plugin.saveSettings();
						this.plugin.updateStyles();
					}));

			// Show default icon toggle
			new Setting(containerEl)
				.setName('Show default icon')
				.setDesc('Display a default icon on pinned tabs without a custom icon')
				.setClass('setting-indent')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.showDefaultIcon)
					.onChange(async (value) => {
						this.plugin.settings.showDefaultIcon = value;
						await this.plugin.saveSettings();
						this.plugin.updateStyles();
						this.display();
					}));

			// Default icon input (only show when default icon is ON)
			if (this.plugin.settings.showDefaultIcon) {
				new Setting(containerEl)
					.setName('Default icon')
					.setDesc('Icon to show on pinned tabs (emoji, symbol, or text)')
					.setClass('setting-indent-2')
					.addText(text => text
						.setPlaceholder('📌')
						.setValue(this.plugin.settings.defaultIcon)
						.onChange(async (value) => {
							this.plugin.settings.defaultIcon = value;
							await this.plugin.saveSettings();
							this.plugin.updateStyles();
						}));
			}
		}

		// ═══════════════════════════════════════════════════════════
		// ICON SOURCES SECTION (placeholder for Phase 3)
		// ═══════════════════════════════════════════════════════════
		new Setting(containerEl)
			.setName('Icon sources')
			.setHeading();

		new Setting(containerEl)
			.setName('Read icon from frontmatter')
			.setDesc('Use the pinned-icon property in note frontmatter')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableFrontmatter)
				.onChange(async (value) => {
					this.plugin.settings.enableFrontmatter = value;
					await this.plugin.saveSettings();
					this.display();
				}));

		if (this.plugin.settings.enableFrontmatter) {
			new Setting(containerEl)
				.setName('Frontmatter property')
				.setDesc('The property name to read from frontmatter')
				.setClass('setting-indent')
				.addText(text => text
					.setValue(this.plugin.settings.frontmatterProperty)
					.onChange(async (value) => {
						this.plugin.settings.frontmatterProperty = value || 'pinned-icon';
						await this.plugin.saveSettings();
					}));
		}

		// ═══════════════════════════════════════════════════════════
		// ICON MAPPINGS SECTION (placeholder for Phase 4)
		// ═══════════════════════════════════════════════════════════
		new Setting(containerEl)
			.setName('Icon mappings')
			.setHeading();

		new Setting(containerEl)
			.setDesc('First match wins. Right-click on files adds exact mappings here.');

		// Placeholder message for now
		if (this.plugin.settings.iconMappings.length === 0) {
			new Setting(containerEl)
				.setDesc('No mappings configured yet.');
		}
	}
}

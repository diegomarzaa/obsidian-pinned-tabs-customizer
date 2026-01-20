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
	showDefaultIcon: true,
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
					this.display();
				}));

		// Nested settings (only show when shrink is ON)
		if (this.plugin.settings.shrinkPinnedTabs) {
			// Width slider with reset button
			new Setting(containerEl)
				.setName('Pinned tab width')
				.setDesc('Width of shrunk pinned tabs in pixels (40 = icon only, 200 = normal)')
				.setClass('setting-indent')
				.addSlider(slider => slider
					.setLimits(40, 200, 4)
					.setValue(this.plugin.settings.pinnedTabWidth)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.pinnedTabWidth = value;
						await this.plugin.saveSettings();
						this.plugin.updateStyles();
					}))
				.addExtraButton(button => button
					.setIcon('reset')
					.setTooltip('Reset to default (40px)')
					.onClick(async () => {
						this.plugin.settings.pinnedTabWidth = DEFAULT_SETTINGS.pinnedTabWidth;
						await this.plugin.saveSettings();
						this.plugin.updateStyles();
						this.display();
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
		// ICON SOURCES SECTION
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
					this.plugin.updateStyles();
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
						this.plugin.updateStyles();
					}));
		}

		// ═══════════════════════════════════════════════════════════
		// ICON MAPPINGS SECTION
		// ═══════════════════════════════════════════════════════════
		new Setting(containerEl)
			.setName('Icon mappings')
			.setHeading();

		new Setting(containerEl)
			.setDesc('First match wins. Types: exact (file name), folder (path prefix), regex (pattern).');

		// Add new mapping button
		new Setting(containerEl)
			.addButton(button => button
				.setButtonText('Add mapping')
				.setCta()
				.onClick(async () => {
					this.plugin.settings.iconMappings.push({
						type: 'exact',
						match: '',
						icon: '📌'
					});
					await this.plugin.saveSettings();
					this.display();
				}));

		// Render existing mappings
		this.plugin.settings.iconMappings.forEach((mapping, index) => {
			this.renderMappingItem(containerEl, mapping, index);
		});
	}

	/**
	 * Render a single mapping item
	 */
	renderMappingItem(containerEl: HTMLElement, mapping: IconMapping, index: number): void {
		const setting = new Setting(containerEl)
			.setClass('mapping-item');

		// Move up button
		setting.addExtraButton(button => button
			.setIcon('arrow-up')
			.setTooltip('Move up')
			.setDisabled(index === 0)
			.onClick(async () => {
				if (index > 0) {
					const mappings = this.plugin.settings.iconMappings;
					const current = mappings[index];
					const prev = mappings[index - 1];
					if (current && prev) {
						mappings[index - 1] = current;
						mappings[index] = prev;
					}
					await this.plugin.saveSettings();
					this.plugin.updateStyles();
					this.display();
				}
			}));

		// Move down button
		setting.addExtraButton(button => button
			.setIcon('arrow-down')
			.setTooltip('Move down')
			.setDisabled(index === this.plugin.settings.iconMappings.length - 1)
			.onClick(async () => {
				const mappings = this.plugin.settings.iconMappings;
				if (index < mappings.length - 1) {
					const current = mappings[index];
					const next = mappings[index + 1];
					if (current && next) {
						mappings[index + 1] = current;
						mappings[index] = next;
					}
					await this.plugin.saveSettings();
					this.plugin.updateStyles();
					this.display();
				}
			}));

		// Type dropdown
		setting.addDropdown(dropdown => dropdown
			.addOption('exact', 'Exact')
			.addOption('folder', 'Folder')
			.addOption('regex', 'Regex')
			.setValue(mapping.type)
			.onChange(async (value) => {
				mapping.type = value as IconMapping['type'];
				await this.plugin.saveSettings();
				this.plugin.updateStyles();
			}));

		// Match input
		setting.addText(text => text
			.setPlaceholder(mapping.type === 'folder' ? 'Projects/' : mapping.type === 'regex' ? '^\\d{4}-\\d{2}-\\d{2}$' : 'Home')
			.setValue(mapping.match)
			.onChange(async (value) => {
				mapping.match = value;
				await this.plugin.saveSettings();
				this.plugin.updateStyles();
			}));

		// Icon input
		setting.addText(text => {
			text.inputEl.addClass('mapping-icon-input');
			text.setPlaceholder('📌')
				.setValue(mapping.icon)
				.onChange(async (value) => {
					mapping.icon = value;
					await this.plugin.saveSettings();
					this.plugin.updateStyles();
				});
		});

		// Delete button
		setting.addExtraButton(button => button
			.setIcon('trash')
			.setTooltip('Delete mapping')
			.onClick(async () => {
				this.plugin.settings.iconMappings.splice(index, 1);
				await this.plugin.saveSettings();
				this.plugin.updateStyles();
				this.display();
			}));
	}
}

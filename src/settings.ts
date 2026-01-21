import {App, FuzzySuggestModal, Modal, PluginSettingTab, Setting, TFile, TFolder} from "obsidian";
import PinnedTabsCustomizerPlugin from "./main";

// ═══════════════════════════════════════════════════════════
// PICKER MODALS
// ═══════════════════════════════════════════════════════════

/**
 * Modal for picking a file from the vault
 */
class FilePickerModal extends FuzzySuggestModal<TFile> {
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

/**
 * Modal for picking a folder from the vault
 */
class FolderPickerModal extends FuzzySuggestModal<TFolder> {
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

/**
 * Modal for entering a regex pattern
 */
class RegexPatternModal extends Modal {
	private pattern: string;
	private onSubmit: (pattern: string) => void;

	constructor(app: App, initialPattern: string, onSubmit: (pattern: string) => void) {
		super(app);
		this.pattern = initialPattern;
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('ptc-modal');

		contentEl.createEl('h2', { text: 'Regex pattern' });

		contentEl.createEl('p', { 
			text: 'Enter a regex pattern to match file names (without extension).',
			cls: 'setting-item-description'
		});

		new Setting(contentEl)
			.setName('Pattern')
			.addText(text => {
				text.setValue(this.pattern)
					.setPlaceholder('^\\d{4}-\\d{2}-\\d{2}$')
					.onChange(value => {
						this.pattern = value;
					});
				text.inputEl.addClass('ptc-pattern-input');
				text.inputEl.focus();
			});

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Save')
				.setCta()
				.onClick(() => {
					if (this.pattern.trim()) {
						this.onSubmit(this.pattern.trim());
						this.close();
					}
				}))
			.addButton(btn => btn
				.setButtonText('Cancel')
				.onClick(() => this.close()));
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

/**
 * Modal for changing the icon of a mapping
 */
class IconPickerModal extends Modal {
	private icon: string;
	private patternName: string;
	private onSubmit: (icon: string) => void;

	constructor(app: App, patternName: string, currentIcon: string, onSubmit: (icon: string) => void) {
		super(app);
		this.patternName = patternName;
		this.icon = currentIcon;
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('ptc-modal');

		contentEl.createEl('h2', { text: 'Change icon' });
		contentEl.createEl('p', { 
			text: `Icon for: ${this.patternName}`,
			cls: 'setting-item-description'
		});

		// Quick emoji suggestions
		const quickPicks = contentEl.createDiv({ cls: 'ptc-quick-picks' });
		const emojis = ['📌', '📁', '📅', '⭐', '🏠', '📝', '💡', '🔖', '🎯', '📊', '🔒', '💼'];
		emojis.forEach(emoji => {
			const btn = quickPicks.createEl('button', { 
				text: emoji, 
				cls: 'ptc-emoji-btn'
			});
			btn.addEventListener('click', () => {
				this.icon = emoji;
				this.onSubmit(this.icon);
				this.close();
			});
		});

		new Setting(contentEl)
			.setName('Custom icon')
			.setDesc('Enter any emoji, symbol, or text')
			.addText(text => {
				text.setValue(this.icon)
					.setPlaceholder('📌')
					.onChange(value => {
						this.icon = value;
					});
				text.inputEl.addClass('ptc-icon-input');
				text.inputEl.focus();
			});

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Save')
				.setCta()
				.onClick(() => {
					this.onSubmit(this.icon || '📌');
					this.close();
				}))
			.addButton(btn => btn
				.setButtonText('Cancel')
				.onClick(() => this.close()));
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// ═══════════════════════════════════════════════════════════
// TYPES & DEFAULTS
// ═══════════════════════════════════════════════════════════

export interface IconMapping {
	type: 'exact' | 'folder' | 'regex';
	match: string;
	icon: string;
}

export interface PinnedTabsCustomizerSettings {
	shrinkPinnedTabs: boolean;
	pinnedTabWidth: number;
	showDefaultIcon: boolean;
	defaultIcon: string;
	enableFrontmatter: boolean;
	frontmatterProperty: string;
	iconMappings: IconMapping[];
}

export const DEFAULT_SETTINGS: PinnedTabsCustomizerSettings = {
	shrinkPinnedTabs: false,
	pinnedTabWidth: 40,
	showDefaultIcon: true,
	defaultIcon: '', // Empty = native Obsidian pin icon
	enableFrontmatter: true,
	frontmatterProperty: 'pinned-icon',
	iconMappings: []
}

// ═══════════════════════════════════════════════════════════
// SETTINGS TAB
// ═══════════════════════════════════════════════════════════

export class PinnedTabsCustomizerSettingTab extends PluginSettingTab {
	plugin: PinnedTabsCustomizerPlugin;

	constructor(app: App, plugin: PinnedTabsCustomizerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass('ptc-settings');

		// ═══════════════════════════════════════════════════════════
		// APPEARANCE SECTION
		// ═══════════════════════════════════════════════════════════
		new Setting(containerEl)
			.setName('Appearance')
			.setHeading();

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

		if (this.plugin.settings.shrinkPinnedTabs) {
			new Setting(containerEl)
				.setName('Pinned tab width')
				.setDesc('Width in pixels (40 = icon only)')
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
					.setTooltip('Reset to default')
					.onClick(async () => {
						this.plugin.settings.pinnedTabWidth = DEFAULT_SETTINGS.pinnedTabWidth;
						await this.plugin.saveSettings();
						this.plugin.updateStyles();
						this.display();
					}));

			new Setting(containerEl)
				.setName('Show default icon')
				.setDesc('Display an icon on tabs without a custom mapping')
				.setClass('setting-indent')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.showDefaultIcon)
					.onChange(async (value) => {
						this.plugin.settings.showDefaultIcon = value;
						await this.plugin.saveSettings();
						this.plugin.updateStyles();
						this.display();
					}));

			if (this.plugin.settings.showDefaultIcon) {
				new Setting(containerEl)
					.setName('Default icon')
					.setDesc('Leave empty to use the native Obsidian pin icon')
					.setClass('setting-indent-2')
					.addText(text => text
						.setPlaceholder('Native pin icon')
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
			.setDesc('Use a frontmatter property (highest priority)')
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
				.setDesc('The property name to read')
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
			.setDesc('First match wins. Frontmatter always has highest priority.')
			.addButton(btn => btn
				.setButtonText('Add file')
				.setTooltip('Add exact file match')
				.onClick(() => {
					new FilePickerModal(this.app, (file) => {
						this.plugin.settings.iconMappings.unshift({
							match: file.basename,
							icon: this.plugin.settings.defaultIcon || '📌',
							type: 'exact',
						});
						void this.plugin.saveSettings();
						this.plugin.updateStyles();
						this.display();
					}).open();
				}))
			.addButton(btn => btn
				.setButtonText('Add folder')
				.setTooltip('Add folder rule (applies to all files in folder)')
				.onClick(() => {
					new FolderPickerModal(this.app, (folder) => {
						this.plugin.settings.iconMappings.unshift({
							match: folder.path,
							icon: '📁',
							type: 'folder',
						});
						void this.plugin.saveSettings();
						this.plugin.updateStyles();
						this.display();
					}).open();
				}))
			.addButton(btn => btn
				.setButtonText('Add pattern')
				.setTooltip('Add regex pattern')
				.onClick(() => {
					new RegexPatternModal(this.app, '', (pattern) => {
						this.plugin.settings.iconMappings.unshift({
							match: pattern,
							icon: '📅',
							type: 'regex',
						});
						void this.plugin.saveSettings();
						this.plugin.updateStyles();
						this.display();
					}).open();
				}));

		// Mappings container for drag-and-drop
		const mappingsContainer = containerEl.createDiv({ cls: 'ptc-mappings-container' });

		// Render mappings
		this.plugin.settings.iconMappings.forEach((mapping, index) => {
			this.renderMapping(mappingsContainer, mapping, index);
		});

		// Empty state
		if (this.plugin.settings.iconMappings.length === 0) {
			containerEl.createDiv({
				text: 'No mappings yet. Add a file, folder, or pattern above.',
				cls: 'ptc-no-mappings setting-item-description',
			});
		}
	}

	// Track drag state
	private draggedIndex: number | null = null;

	/**
	 * Render a single mapping row with drag-and-drop support
	 */
	private renderMapping(container: HTMLElement, mapping: IconMapping, index: number): void {
		const setting = new Setting(container);
		const settingEl = setting.settingEl;
		settingEl.addClass('ptc-mapping-item');
		
		// Make draggable
		settingEl.setAttribute('draggable', 'true');
		settingEl.dataset.index = String(index);

		// Drag handle indicator
		const dragHandle = settingEl.createDiv({ cls: 'ptc-drag-handle' });
		dragHandle.textContent = '⋮⋮';
		settingEl.prepend(dragHandle);

		// Drag events
		settingEl.addEventListener('dragstart', (e) => {
			this.draggedIndex = index;
			settingEl.addClass('ptc-dragging');
			if (e.dataTransfer) {
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/plain', String(index));
			}
		});

		settingEl.addEventListener('dragend', () => {
			this.draggedIndex = null;
			settingEl.removeClass('ptc-dragging');
			// Remove all drag-over states
			container.querySelectorAll('.ptc-drag-over').forEach(el => el.removeClass('ptc-drag-over'));
		});

		settingEl.addEventListener('dragover', (e) => {
			e.preventDefault();
			if (this.draggedIndex === null || this.draggedIndex === index) return;
			
			settingEl.addClass('ptc-drag-over');
			if (e.dataTransfer) {
				e.dataTransfer.dropEffect = 'move';
			}
		});

		settingEl.addEventListener('dragleave', () => {
			settingEl.removeClass('ptc-drag-over');
		});

		settingEl.addEventListener('drop', (e) => {
			e.preventDefault();
			settingEl.removeClass('ptc-drag-over');
			
			if (this.draggedIndex === null || this.draggedIndex === index) return;

			// Reorder the array
			const mappings = this.plugin.settings.iconMappings;
			const [draggedItem] = mappings.splice(this.draggedIndex, 1);
			if (draggedItem) {
				mappings.splice(index, 0, draggedItem);
				void this.plugin.saveSettings();
				this.plugin.updateStyles();
				this.display();
			}
		});

		// Build the name with emoji + pattern + type badge
		const nameEl = document.createDocumentFragment();
		
		const emojiSpan = document.createElement('span');
		emojiSpan.addClass('ptc-mapping-emoji');
		emojiSpan.textContent = mapping.icon + ' ';
		nameEl.appendChild(emojiSpan);
		
		const matchSpan = document.createElement('span');
		if (mapping.type === 'regex') {
			matchSpan.addClass('ptc-regex-pattern');
		}
		matchSpan.textContent = mapping.match || '(empty)';
		nameEl.appendChild(matchSpan);
		
		if (mapping.type !== 'exact') {
			const typeLabels = { exact: '', regex: ' (regex)', folder: ' (folder)' };
			const badgeSpan = document.createElement('span');
			badgeSpan.addClass('ptc-type-badge');
			badgeSpan.textContent = typeLabels[mapping.type];
			nameEl.appendChild(badgeSpan);
		}
		
		setting.setName(nameEl);

		// Change icon button
		setting.addExtraButton(btn => btn
			.setIcon('smile')
			.setTooltip('Change icon')
			.onClick(() => {
				new IconPickerModal(
					this.app,
					mapping.match,
					mapping.icon,
					(icon) => {
						mapping.icon = icon;
						void this.plugin.saveSettings();
						this.plugin.updateStyles();
						this.display();
					}
				).open();
			}));

		// Edit pattern button
		setting.addExtraButton(btn => btn
			.setIcon('pencil')
			.setTooltip('Edit pattern')
			.onClick(() => {
				if (mapping.type === 'regex') {
					new RegexPatternModal(this.app, mapping.match, (pattern) => {
						mapping.match = pattern;
						void this.plugin.saveSettings();
						this.plugin.updateStyles();
						this.display();
					}).open();
				} else if (mapping.type === 'folder') {
					new FolderPickerModal(this.app, (folder) => {
						mapping.match = folder.path;
						void this.plugin.saveSettings();
						this.plugin.updateStyles();
						this.display();
					}).open();
				} else {
					new FilePickerModal(this.app, (file) => {
						mapping.match = file.basename;
						void this.plugin.saveSettings();
						this.plugin.updateStyles();
						this.display();
					}).open();
				}
			}));

		// Delete button
		setting.addExtraButton(btn => btn
			.setIcon('trash')
			.setTooltip('Delete')
			.onClick(() => {
				this.plugin.settings.iconMappings.splice(index, 1);
				void this.plugin.saveSettings();
				this.plugin.updateStyles();
				this.display();
			}));
	}
}

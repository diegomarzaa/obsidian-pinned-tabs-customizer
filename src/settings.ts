import { App, PluginSettingTab, setIcon, Setting, TFile } from "obsidian";
import type PinnedTabsCustomizerPlugin from "./main";
import { DEFAULT_SETTINGS, isLucideIcon, getLucideIconName, type IconMapping } from "./types";
import { IconPickerModal, FilePickerModal, FolderPickerModal, PatternEditorModal, TagPickerModal } from "./modals";
import { PATTERN_TYPE_LABELS } from "./pattern-presets";
import { testPattern } from "./modals/pattern-editor";

// Re-export types for convenience
export type { IconMapping, PinnedTabsCustomizerSettings } from "./types";
export { DEFAULT_SETTINGS } from "./types";

/**
 * Settings tab for the plugin
 */
export class PinnedTabsCustomizerSettingTab extends PluginSettingTab {
	plugin: PinnedTabsCustomizerPlugin;
	private expandedConflicts = new Set<number>();

	constructor(app: App, plugin: PinnedTabsCustomizerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass('ptc-settings');
		
		// Clear expanded conflicts state
		this.expandedConflicts.clear();

		this.renderAppearanceSection(containerEl);
		this.renderIconSourcesSection(containerEl);
		this.renderMappingsSection(containerEl);
	}

	// ═══════════════════════════════════════════════════════════
	// APPEARANCE SECTION
	// ═══════════════════════════════════════════════════════════

	private renderAppearanceSection(containerEl: HTMLElement): void {
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
						}))
					.addExtraButton(btn => btn
						.setIcon('smile')
						.setTooltip('Pick icon')
						.onClick(() => {
							new IconPickerModal(this.app, this.plugin, (icon) => {
								this.plugin.settings.defaultIcon = icon;
								void this.plugin.saveSettings();
								this.plugin.updateStyles();
								this.display();
							}).open();
						}));
			}
		}
	}

	// ═══════════════════════════════════════════════════════════
	// ICON SOURCES SECTION
	// ═══════════════════════════════════════════════════════════

	private renderIconSourcesSection(containerEl: HTMLElement): void {
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
	}

	// ═══════════════════════════════════════════════════════════
	// ICON MAPPINGS SECTION
	// ═══════════════════════════════════════════════════════════

	private renderMappingsSection(containerEl: HTMLElement): void {
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
				.setTooltip('Add pattern rule (starts with, contains, regex...)')
				.onClick(() => {
					new PatternEditorModal(this.app, 'starts-with', '', (type, pattern) => {
						this.plugin.settings.iconMappings.unshift({
							match: pattern,
							icon: '📝',
							type: type,
						});
						void this.plugin.saveSettings();
						this.plugin.updateStyles();
						this.display();
					}).open();
				}))
			.addButton(btn => btn
				.setButtonText('Add tag')
				.setTooltip('Add tag rule (matches files with a specific tag)')
				.onClick(() => {
					new TagPickerModal(this.app, (tag) => {
						this.plugin.settings.iconMappings.unshift({
							match: tag,
							icon: '🏷️',
							type: 'tag',
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
		// Wrap each mapping in a container so conflict details can appear below
		const mappingWrapper = container.createDiv({ cls: 'ptc-mapping-wrapper' });
		
		const setting = new Setting(mappingWrapper);
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
		if (isLucideIcon(mapping.icon)) {
			// Render Lucide icon
			const iconName = getLucideIconName(mapping.icon);
			setIcon(emojiSpan, iconName);
		} else {
			// Render emoji/text
			emojiSpan.textContent = mapping.icon + ' ';
		}
		nameEl.appendChild(emojiSpan);
		
		const matchSpan = document.createElement('span');
		if (mapping.type === 'regex') {
			matchSpan.addClass('ptc-regex-pattern');
		}
		matchSpan.textContent = mapping.match || '(empty)';
		nameEl.appendChild(matchSpan);
		
		// Show type badge for non-exact types
		if (mapping.type !== 'exact') {
			const badgeSpan = document.createElement('span');
			badgeSpan.addClass('ptc-type-badge');
			badgeSpan.textContent = PATTERN_TYPE_LABELS[mapping.type] || mapping.type;
			nameEl.appendChild(badgeSpan);
		}

		// Show match count badge
		const matchCount = this.countMatchingFiles(mapping);
		const countBadge = document.createElement('span');
		countBadge.addClass('ptc-count-badge');
		countBadge.textContent = `${matchCount} file${matchCount !== 1 ? 's' : ''}`;
		if (matchCount === 0) {
			countBadge.addClass('ptc-count-zero');
		}
		nameEl.appendChild(countBadge);

		// Show conflict badge if this mapping has conflicts
		const conflicts = this.getMappingConflicts(mapping, index);
		if (conflicts.length > 0) {
			const conflictBadge = document.createElement('span');
			conflictBadge.addClass('ptc-conflict-badge');
			conflictBadge.textContent = `⚠️ ${conflicts.length} conflict${conflicts.length !== 1 ? 's' : ''}`;
			conflictBadge.setAttribute('role', 'button');
			conflictBadge.setAttribute('tabindex', '0');
			conflictBadge.setAttribute('title', 'Click to see conflicts');
			nameEl.appendChild(conflictBadge);

			// Make it clickable to toggle details
			conflictBadge.addEventListener('click', (e) => {
				e.stopPropagation();
				this.toggleConflictDetails(mappingWrapper, settingEl, mapping, index, conflicts);
			});
		}
		
		setting.setName(nameEl);

		// Change icon button - uses the new enhanced picker
		setting.addExtraButton(btn => btn
			.setIcon('smile')
			.setTooltip('Change icon')
			.onClick(() => {
				new IconPickerModal(this.app, this.plugin, (icon) => {
					mapping.icon = icon;
					void this.plugin.saveSettings();
					this.plugin.updateStyles();
					this.display();
				}).open();
			}));

		// Edit pattern button
		setting.addExtraButton(btn => btn
			.setIcon('pencil')
			.setTooltip('Edit pattern')
			.onClick(() => {
				if (mapping.type === 'folder') {
					new FolderPickerModal(this.app, (folder) => {
						mapping.match = folder.path;
						void this.plugin.saveSettings();
						this.plugin.updateStyles();
						this.display();
					}).open();
				} else if (mapping.type === 'exact') {
					new FilePickerModal(this.app, (file) => {
						mapping.match = file.basename;
						void this.plugin.saveSettings();
						this.plugin.updateStyles();
						this.display();
					}).open();
				} else if (mapping.type === 'tag') {
					new TagPickerModal(this.app, (tag) => {
						mapping.match = tag;
						void this.plugin.saveSettings();
						this.plugin.updateStyles();
						this.display();
					}).open();
				} else {
					// For all pattern types: starts-with, ends-with, contains, regex
					new PatternEditorModal(this.app, mapping.type, mapping.match, (type, pattern) => {
						mapping.type = type;
						mapping.match = pattern;
						void this.plugin.saveSettings();
						this.plugin.updateStyles();
						this.display();
					}).open();
				}
			}));

		// Duplicate button
		setting.addExtraButton(btn => btn
			.setIcon('copy')
			.setTooltip('Duplicate')
			.onClick(() => {
				const duplicate = {
					type: mapping.type,
					match: mapping.match,
					icon: mapping.icon
				};
				// Insert right after the current mapping
				this.plugin.settings.iconMappings.splice(index + 1, 0, duplicate);
				void this.plugin.saveSettings();
				this.plugin.updateStyles();
				this.display();
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

	/**
	 * Count how many files in the vault match a mapping
	 */
	private countMatchingFiles(mapping: IconMapping): number {
		const allFiles = this.app.vault.getMarkdownFiles();
		let count = 0;

		for (const file of allFiles) {
			if (this.fileMatchesMapping(file, mapping)) {
				count++;
			}
		}

		return count;
	}

	/**
	 * Check if a file matches a specific mapping
	 */
	private fileMatchesMapping(file: TFile, mapping: IconMapping): boolean {
		if (!mapping.match) return false;

		const fileName = file.basename;
		const filePath = file.path;

		switch (mapping.type) {
			case 'exact':
				return fileName === mapping.match;
			case 'folder':
				return filePath.startsWith(mapping.match + '/') || filePath === mapping.match;
			case 'tag':
				return this.plugin.fileHasTag(file, mapping.match);
			case 'starts-with':
			case 'ends-with':
			case 'contains':
			case 'regex':
				return testPattern(fileName, mapping.type, mapping.match);
			default:
				return false;
		}
	}

	/**
	 * Get conflicts for a mapping (files that match this mapping but also match earlier mappings)
	 */
	private getMappingConflicts(mapping: IconMapping, currentIndex: number): Array<{ file: TFile; winningIndex: number; winningMapping: IconMapping }> {
		const conflicts: Array<{ file: TFile; winningIndex: number; winningMapping: IconMapping }> = [];
		const allFiles = this.app.vault.getMarkdownFiles();

		// Check each file that matches this mapping
		for (const file of allFiles) {
			if (!this.fileMatchesMapping(file, mapping)) continue;

			// Check if an earlier mapping also matches this file
			for (let i = 0; i < currentIndex; i++) {
				const earlierMapping = this.plugin.settings.iconMappings[i];
				if (!earlierMapping) continue;
				if (this.fileMatchesMapping(file, earlierMapping)) {
					conflicts.push({
						file: file,
						winningIndex: i,
						winningMapping: earlierMapping
					});
					break; // Only count first conflict (first match wins)
				}
			}
		}

		return conflicts;
	}

	/**
	 * Toggle conflict details display
	 */
	private toggleConflictDetails(wrapper: HTMLElement, settingEl: HTMLElement, mapping: IconMapping, index: number, conflicts: Array<{ file: TFile; winningIndex: number; winningMapping: IconMapping }>): void {
		// Remove existing details if present
		const existingDetails = wrapper.querySelector('.ptc-conflict-details');
		if (existingDetails) {
			existingDetails.remove();
			this.expandedConflicts.delete(index);
			return;
		}

		// Create conflict details section below the setting item
		const details = wrapper.createDiv({ cls: 'ptc-conflict-details' });
		
		const header = details.createDiv({ cls: 'ptc-conflict-header' });
		header.createEl('strong', { text: `${conflicts.length} file${conflicts.length !== 1 ? 's' : ''} already matched by earlier rules:` });

		const conflictsList = details.createDiv({ cls: 'ptc-conflict-list' });
		
		conflicts.forEach(({ file, winningIndex, winningMapping }) => {
			const conflictItem = conflictsList.createDiv({ cls: 'ptc-conflict-item' });
			
			// File name (clickable to open)
			const fileNameEl = conflictItem.createEl('span', { cls: 'ptc-conflict-file', text: file.basename });
			fileNameEl.setAttribute('role', 'button');
			fileNameEl.setAttribute('title', 'Click to open file');
			fileNameEl.addEventListener('click', () => {
				void this.app.workspace.openLinkText(file.path, '', false);
			});

			conflictItem.createSpan({ text: ' → ' });

			// Winning rule info
			const winningRuleEl = conflictItem.createEl('span', { cls: 'ptc-conflict-rule' });
			winningRuleEl.textContent = `Rule #${winningIndex + 1}`;
			winningRuleEl.setAttribute('title', `Wins: ${winningMapping.match} (${PATTERN_TYPE_LABELS[winningMapping.type] || winningMapping.type})`);

			// Quick action: Move this rule up
			const moveUpBtn = conflictItem.createEl('button', { 
				cls: 'ptc-conflict-action', 
				text: 'Move up',
				title: 'Move this rule above the winning rule'
			});
			moveUpBtn.addEventListener('click', () => {
				const mappings = this.plugin.settings.iconMappings;
				const [currentMapping] = mappings.splice(index, 1);
				if (currentMapping) {
					mappings.splice(winningIndex, 0, currentMapping);
					void this.plugin.saveSettings();
					this.plugin.updateStyles();
					this.display();
				}
			});
		});

		this.expandedConflicts.add(index);
	}
}

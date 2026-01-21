import { Menu, Plugin, setIcon, TAbstractFile, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, NATIVE_PIN_ICON, isLucideIcon, getLucideIconName, type PinnedTabsCustomizerSettings, type PatternType } from './types';
import { PinnedTabsCustomizerSettingTab } from './settings';
import { IconPickerModal, FilePickerModal, FolderPickerModal, PatternEditorModal, TagPickerModal } from './modals';

export default class PinnedTabsCustomizerPlugin extends Plugin {
	settings: PinnedTabsCustomizerSettings;
	private pinObserver: MutationObserver | null = null;

	async onload() {
		await this.loadSettings();

		// Apply initial styles
		this.updateStyles();

		// Watch for workspace changes to update pinned tab icons
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.updatePinnedTabIcons();
			})
		);

		// Watch for active leaf changes (includes tab switching)
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.updatePinnedTabIcons();
			})
		);

		// Watch for metadata changes (frontmatter updates)
		this.registerEvent(
			this.app.metadataCache.on('changed', () => {
				this.updatePinnedTabIcons();
			})
		);

		// Set up MutationObserver to watch for pin state changes
		this.setupPinObserver();

		// Initial update
		this.updatePinnedTabIcons();

		// Add settings tab
		this.addSettingTab(new PinnedTabsCustomizerSettingTab(this.app, this));

		// Add command to set icon for current file
		this.addCommand({
			id: 'set-pinned-tab-icon',
			name: 'Set icon for current file',
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (file) {
					if (!checking) {
						this.openIconModal(file);
					}
					return true;
				}
				return false;
			}
		});

		// Add command to set icon for any file
		this.addCommand({
			id: 'set-icon-for-file',
			name: 'Set icon for a file',
			callback: () => {
				new FilePickerModal(this.app, (file) => {
					this.openIconModal(file);
				}).open();
			}
		});

		// Add command to set icon for a folder
		this.addCommand({
			id: 'set-icon-for-folder',
			name: 'Set icon for a folder',
			callback: () => {
				new FolderPickerModal(this.app, (folder) => {
					new IconPickerModal(this.app, this, (icon) => {
						this.settings.iconMappings.unshift({
							match: folder.path,
							icon: icon,
							type: 'folder',
						});
						void this.saveSettings();
						this.updatePinnedTabIcons();
					}).open();
				}).open();
			}
		});

		// Add command to create a pattern rule
		this.addCommand({
			id: 'add-pattern-rule',
			name: 'Add pattern rule',
			callback: () => {
				new PatternEditorModal(this.app, 'starts-with', '', (type: PatternType, pattern: string) => {
					new IconPickerModal(this.app, this, (icon) => {
						this.settings.iconMappings.unshift({
							match: pattern,
							icon: icon,
							type: type,
						});
						void this.saveSettings();
						this.updatePinnedTabIcons();
					}).open();
				}).open();
			}
		});

		// Add command to create a tag rule
		this.addCommand({
			id: 'add-tag-rule',
			name: 'Add tag rule',
			callback: () => {
				new TagPickerModal(this.app, (tag) => {
					new IconPickerModal(this.app, this, (icon) => {
						this.settings.iconMappings.unshift({
							match: tag,
							icon: icon,
							type: 'tag',
						});
						void this.saveSettings();
						this.updatePinnedTabIcons();
					}).open();
				}).open();
			}
		});

		// Add right-click context menu on files
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
				if (file instanceof TFile) {
					menu.addItem((item) => {
						item
							.setTitle('Set pinned tab icon')
							.setIcon('pin')
							.onClick(() => {
								this.openIconModal(file);
							});
					});
				}
			})
		);
	}

	onunload() {
		// Clean up CSS variables and classes
		document.body.classList.remove('pinned-tabs-shrink');
		document.body.style.removeProperty('--pinned-tab-size');
		
		// Disconnect pin observer
		if (this.pinObserver) {
			this.pinObserver.disconnect();
			this.pinObserver = null;
		}
		
		// Remove all custom icons we added
		this.clearAllCustomIcons();
	}

	/**
	 * Set up a MutationObserver to watch for pin/unpin changes
	 */
	setupPinObserver() {
		if (this.pinObserver) {
			this.pinObserver.disconnect();
		}

		this.pinObserver = new MutationObserver((mutations) => {
			let needsUpdate = false;
			
			for (const mutation of mutations) {
				if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
					const target = mutation.target as HTMLElement;
					if (target.classList.contains('workspace-tab-header-status-icon')) {
						needsUpdate = true;
						break;
					}
				}
				if (mutation.type === 'childList') {
					const target = mutation.target as HTMLElement;
					if (target.classList.contains('workspace-tab-header-status-container')) {
						needsUpdate = true;
						break;
					}
				}
			}

			if (needsUpdate) {
				this.updatePinnedTabIcons();
			}
		});

		const workspace = document.querySelector('.workspace');
		if (workspace) {
			this.pinObserver.observe(workspace, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ['class']
			});
		}
	}

	updateStyles() {
		if (this.settings.shrinkPinnedTabs) {
			document.body.classList.add('pinned-tabs-shrink');
			document.body.style.setProperty('--pinned-tab-size', `${this.settings.pinnedTabWidth}px`);
		} else {
			document.body.classList.remove('pinned-tabs-shrink');
			document.body.style.removeProperty('--pinned-tab-size');
		}
		
		this.updatePinnedTabIcons();
	}

	/**
	 * Update icons on all pinned tabs
	 */
	updatePinnedTabIcons() {
		const pinnedTabs = document.querySelectorAll('.workspace-tab-header:has(.workspace-tab-header-status-icon.mod-pinned)');
		
		pinnedTabs.forEach(tab => {
			this.updateTabIcon(tab as HTMLElement);
		});

		const allTabs = document.querySelectorAll('.workspace-tab-header');
		allTabs.forEach(tab => {
			const isPinned = tab.querySelector('.workspace-tab-header-status-icon.mod-pinned');
			if (!isPinned) {
				this.clearTabIcon(tab as HTMLElement);
			}
		});
	}

	/**
	 * Get the file associated with a tab element
	 */
	getFileFromTab(tabEl: HTMLElement): TFile | null {
		const fileName = tabEl.getAttribute('aria-label');
		if (!fileName) return null;

		const files = this.app.vault.getMarkdownFiles();
		return files.find(f => f.basename === fileName) || null;
	}

	/**
	 * Get icon from frontmatter for a file
	 */
	getIconFromFrontmatter(file: TFile): string | null {
		if (!this.settings.enableFrontmatter) return null;

		const cache = this.app.metadataCache.getFileCache(file);
		const frontmatter = cache?.frontmatter;
		
		if (!frontmatter) return null;

		const icon = frontmatter[this.settings.frontmatterProperty] as string | undefined;
		return icon ? String(icon) : null;
	}

	/**
	 * Get icon from mappings for a file
	 */
	getIconFromMappings(file: TFile): string | null {
		const fileName = file.basename;
		const filePath = file.path;

		for (const mapping of this.settings.iconMappings) {
			if (!mapping.match || !mapping.icon) continue;

			switch (mapping.type) {
				case 'exact':
					if (fileName === mapping.match) {
						return mapping.icon;
					}
					break;

				case 'folder':
					if (filePath.startsWith(mapping.match + '/') || filePath === mapping.match) {
						return mapping.icon;
					}
					break;

				case 'starts-with':
					if (fileName.startsWith(mapping.match)) {
						return mapping.icon;
					}
					break;

				case 'ends-with':
					if (fileName.endsWith(mapping.match)) {
						return mapping.icon;
					}
					break;

				case 'contains':
					if (fileName.includes(mapping.match)) {
						return mapping.icon;
					}
					break;

				case 'regex':
					try {
						const regex = new RegExp(mapping.match);
						if (regex.test(fileName)) {
							return mapping.icon;
						}
					} catch {
						// Invalid regex, skip
					}
					break;

				case 'tag':
					if (this.fileHasTag(file, mapping.match)) {
						return mapping.icon;
					}
					break;
			}
		}

		return null;
	}

	/**
	 * Check if a file has a specific tag
	 */
	fileHasTag(file: TFile, tag: string): boolean {
		const cache = this.app.metadataCache.getFileCache(file);
		if (!cache) return false;

		const normalizedTag = tag.replace(/^#/, '').toLowerCase();

		// Check frontmatter tags
		if (cache.frontmatter?.tags) {
			const fmTags = cache.frontmatter.tags as string[] | string;
			if (Array.isArray(fmTags)) {
				if (fmTags.some(t => String(t).replace(/^#/, '').toLowerCase() === normalizedTag)) {
					return true;
				}
			} else if (typeof fmTags === 'string') {
				if (fmTags.replace(/^#/, '').toLowerCase() === normalizedTag) {
					return true;
				}
			}
		}

		// Check inline tags
		if (cache.tags) {
			if (cache.tags.some(t => t.tag.replace(/^#/, '').toLowerCase() === normalizedTag)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Resolve the icon for a pinned tab (priority: frontmatter > mappings > default)
	 */
	resolveIconForTab(tabEl: HTMLElement): string | null {
		const file = this.getFileFromTab(tabEl);
		
		if (file) {
			const frontmatterIcon = this.getIconFromFrontmatter(file);
			if (frontmatterIcon) return frontmatterIcon;

			const mappingIcon = this.getIconFromMappings(file);
			if (mappingIcon) return mappingIcon;
		}

		if (this.settings.showDefaultIcon) {
			return this.settings.defaultIcon || NATIVE_PIN_ICON;
		}

		return null;
	}

	/**
	 * Update the icon for a single pinned tab
	 */
	updateTabIcon(tabEl: HTMLElement) {
		const innerContainer = tabEl.querySelector('.workspace-tab-header-inner');
		if (!innerContainer) return;

		if (!this.settings.shrinkPinnedTabs) {
			this.clearTabIcon(tabEl);
			return;
		}

		const icon = this.resolveIconForTab(tabEl);

		if (icon) {
			let customIcon = tabEl.querySelector('.pinned-tab-custom-icon') as HTMLElement;
			
			if (!customIcon) {
				customIcon = document.createElement('span');
				customIcon.className = 'pinned-tab-custom-icon';
				innerContainer.insertBefore(customIcon, innerContainer.firstChild);
			}

			// Clear previous content
			customIcon.empty();

			if (icon === NATIVE_PIN_ICON) {
				// Clone the native pin SVG
				const nativePinSvg = tabEl.querySelector('.workspace-tab-header-status-icon.mod-pinned svg');
				if (nativePinSvg) {
					const clonedSvg = nativePinSvg.cloneNode(true) as SVGElement;
					customIcon.appendChild(clonedSvg);
				} else {
					customIcon.textContent = '📌';
				}
			} else if (isLucideIcon(icon)) {
				// Render Lucide icon using setIcon
				const iconName = getLucideIconName(icon);
				setIcon(customIcon, iconName);
			} else {
				// Render emoji/text
				customIcon.textContent = icon;
			}
			
			tabEl.classList.add('has-custom-icon');
		} else {
			this.clearTabIcon(tabEl);
		}
	}

	/**
	 * Remove custom icon from a tab
	 */
	clearTabIcon(tabEl: HTMLElement) {
		const customIcon = tabEl.querySelector('.pinned-tab-custom-icon');
		if (customIcon) {
			customIcon.remove();
		}
		tabEl.classList.remove('has-custom-icon');
	}

	/**
	 * Clear all custom icons (used on unload)
	 */
	clearAllCustomIcons() {
		const customIcons = document.querySelectorAll('.pinned-tab-custom-icon');
		customIcons.forEach(icon => icon.remove());

		const tabs = document.querySelectorAll('.workspace-tab-header.has-custom-icon');
		tabs.forEach(tab => {
			tab.classList.remove('has-custom-icon');
		});
	}

	/**
	 * Open icon picker modal for a file
	 */
	openIconModal(file: TFile) {
		new IconPickerModal(this.app, this, (icon) => {
			void this.setIconMapping(file.basename, icon);
		}).open();
	}

	/**
	 * Add or update an exact mapping for a file
	 */
	async setIconMapping(fileName: string, icon: string) {
		const existingIndex = this.settings.iconMappings.findIndex(
			m => m.type === 'exact' && m.match === fileName
		);

		if (icon) {
			const existingMapping = existingIndex >= 0 ? this.settings.iconMappings[existingIndex] : null;
			if (existingMapping) {
				existingMapping.icon = icon;
			} else {
				this.settings.iconMappings.unshift({
					type: 'exact',
					match: fileName,
					icon: icon
				});
			}
		} else {
			if (existingIndex >= 0) {
				this.settings.iconMappings.splice(existingIndex, 1);
			}
		}

		await this.saveSettings();
		this.updateStyles();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<PinnedTabsCustomizerSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

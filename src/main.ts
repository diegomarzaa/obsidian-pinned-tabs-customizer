import {Plugin, TFile} from 'obsidian';
import {DEFAULT_SETTINGS, PinnedTabsCustomizerSettings, PinnedTabsCustomizerSettingTab} from "./settings";

export default class PinnedTabsCustomizerPlugin extends Plugin {
	settings: PinnedTabsCustomizerSettings;

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

		// Watch for metadata changes (frontmatter updates)
		this.registerEvent(
			this.app.metadataCache.on('changed', () => {
				this.updatePinnedTabIcons();
			})
		);

		// Initial update
		this.updatePinnedTabIcons();

		// Add settings tab
		this.addSettingTab(new PinnedTabsCustomizerSettingTab(this.app, this));
	}

	onunload() {
		// Clean up CSS variables and classes
		document.body.classList.remove('pinned-tabs-shrink');
		document.body.style.removeProperty('--pinned-tab-size');
		
		// Remove all custom icons we added
		this.clearAllCustomIcons();
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
		
		// Update icons whenever styles change
		this.updatePinnedTabIcons();
	}

	/**
	 * Update icons on all pinned tabs
	 */
	updatePinnedTabIcons() {
		// Find all pinned tabs (tabs that have a .mod-pinned status icon)
		const pinnedTabs = document.querySelectorAll('.workspace-tab-header:has(.workspace-tab-header-status-icon.mod-pinned)');
		
		pinnedTabs.forEach(tab => {
			this.updateTabIcon(tab as HTMLElement);
		});

		// Clean up icons from unpinned tabs
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
		// Get file name from aria-label attribute
		const fileName = tabEl.getAttribute('aria-label');
		if (!fileName) return null;

		// Find the file in the vault
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
	 * Resolve the icon for a pinned tab (priority: frontmatter > default)
	 */
	resolveIconForTab(tabEl: HTMLElement): string | null {
		// Try frontmatter first
		const file = this.getFileFromTab(tabEl);
		if (file) {
			const frontmatterIcon = this.getIconFromFrontmatter(file);
			if (frontmatterIcon) return frontmatterIcon;
		}

		// Fall back to default icon (if enabled)
		if (this.settings.showDefaultIcon) {
			return this.settings.defaultIcon || '📌';
		}

		return null;
	}

	/**
	 * Update the icon for a single pinned tab
	 */
	updateTabIcon(tabEl: HTMLElement) {
		// Add to the tab header itself, not the icon container
		const innerContainer = tabEl.querySelector('.workspace-tab-header-inner');
		if (!innerContainer) return;

		// Only show icons when shrink is enabled
		if (!this.settings.shrinkPinnedTabs) {
			this.clearTabIcon(tabEl);
			return;
		}

		// Resolve the icon for this tab
		const icon = this.resolveIconForTab(tabEl);

		if (icon) {
			// Check if we already have a custom icon element
			let customIcon = tabEl.querySelector('.pinned-tab-custom-icon') as HTMLElement;
			
			if (!customIcon) {
				// Create the custom icon element
				customIcon = document.createElement('span');
				customIcon.className = 'pinned-tab-custom-icon';
				// Insert at the beginning of inner container
				innerContainer.insertBefore(customIcon, innerContainer.firstChild);
			}

			// Update the icon content
			customIcon.textContent = icon;
			
			// Add class to the tab to hide the original icon
			tabEl.classList.add('has-custom-icon');
		} else {
			// Remove custom icon and show original
			this.clearTabIcon(tabEl);
		}
	}

	/**
	 * Remove custom icon from a tab
	 */
	clearTabIcon(tabEl: HTMLElement) {
		// Remove custom icon element
		const customIcon = tabEl.querySelector('.pinned-tab-custom-icon');
		if (customIcon) {
			customIcon.remove();
		}

		// Remove class to show the original icon
		tabEl.classList.remove('has-custom-icon');
	}

	/**
	 * Clear all custom icons (used on unload)
	 */
	clearAllCustomIcons() {
		const customIcons = document.querySelectorAll('.pinned-tab-custom-icon');
		customIcons.forEach(icon => icon.remove());

		// Remove all has-custom-icon classes
		const tabs = document.querySelectorAll('.workspace-tab-header.has-custom-icon');
		tabs.forEach(tab => {
			tab.classList.remove('has-custom-icon');
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<PinnedTabsCustomizerSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

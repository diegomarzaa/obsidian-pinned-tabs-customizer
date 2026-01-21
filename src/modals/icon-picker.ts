import { App, Modal, setIcon } from 'obsidian';
import { EMOJI_CATEGORIES, LUCIDE_ICONS } from '../icon-data';
import { MAX_RECENT_ICONS, LUCIDE_PREFIX, isLucideIcon, getLucideIconName } from '../types';
import type PinnedTabsCustomizerPlugin from '../main';

/**
 * Enhanced icon picker modal with categories, search, and recent icons
 */
export class IconPickerModal extends Modal {
	private plugin: PinnedTabsCustomizerPlugin;
	private onSelect: (icon: string) => void;
	private searchQuery: string = '';
	private selectedCategory: string = 'recent';
	private contentContainer: HTMLElement | null = null;

	constructor(app: App, plugin: PinnedTabsCustomizerPlugin, onSelect: (icon: string) => void) {
		super(app);
		this.plugin = plugin;
		this.onSelect = onSelect;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('ptc-icon-picker');

		// Title
		contentEl.createEl('h2', { text: 'Choose an icon' });

		// Search input
		const searchContainer = contentEl.createDiv({ cls: 'ptc-icon-search' });
		const searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search icons...',
			cls: 'ptc-icon-search-input'
		});
		searchInput.addEventListener('input', (e) => {
			this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
			this.renderContent();
		});

		// Category tabs
		const tabsContainer = contentEl.createDiv({ cls: 'ptc-icon-tabs' });
		this.renderTabs(tabsContainer);

		// Content area
		this.contentContainer = contentEl.createDiv({ cls: 'ptc-icon-content' });
		this.renderContent();

		// Custom input section
		const customSection = contentEl.createDiv({ cls: 'ptc-custom-input-section' });
		customSection.createEl('span', { text: 'Or enter custom:', cls: 'ptc-custom-label' });
		const customInput = customSection.createEl('input', {
			type: 'text',
			placeholder: 'Type emoji or text',
			cls: 'ptc-custom-input'
		});
		const customBtn = customSection.createEl('button', { text: 'Use', cls: 'ptc-custom-btn' });
		customBtn.addEventListener('click', () => {
			if (customInput.value) {
				this.selectIcon(customInput.value, false);
			}
		});
		customInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && customInput.value) {
				this.selectIcon(customInput.value, false);
			}
		});

		// Focus search
		searchInput.focus();
	}

	private renderTabs(container: HTMLElement): void {
		container.empty();

		const categories = [
			{ id: 'recent', name: '🕐 Recent' },
			{ id: 'lucide', name: '⚡ Icons' },
			...EMOJI_CATEGORIES.map(c => ({ id: c.name.toLowerCase(), name: c.name }))
		];

		categories.forEach(cat => {
			const tab = container.createEl('button', {
				text: cat.name,
				cls: `ptc-icon-tab ${this.selectedCategory === cat.id ? 'is-active' : ''}`
			});
			tab.addEventListener('click', () => {
				this.selectedCategory = cat.id;
				this.renderTabs(container);
				this.renderContent();
			});
		});
	}

	private renderContent(): void {
		if (!this.contentContainer) return;
		this.contentContainer.empty();

		if (this.searchQuery) {
			this.renderSearchResults();
			return;
		}

		if (this.selectedCategory === 'recent') {
			this.renderRecentIcons();
			return;
		}

		if (this.selectedCategory === 'lucide') {
			this.renderLucideIcons();
			return;
		}

		// Emoji category
		const category = EMOJI_CATEGORIES.find(c => c.name.toLowerCase() === this.selectedCategory);
		if (category) {
			this.renderEmojiGrid(category.icons);
		}
	}

	private renderRecentIcons(): void {
		if (!this.contentContainer) return;

		const recentIcons = this.plugin.settings.recentIcons;
		
		if (recentIcons.length === 0) {
			this.contentContainer.createDiv({ 
				text: 'No recent icons. Pick one from the categories!', 
				cls: 'ptc-no-results' 
			});
			return;
		}

		const grid = this.contentContainer.createDiv({ cls: 'ptc-icon-grid' });
		
		recentIcons.forEach(icon => {
			const iconBtn = grid.createEl('button', { cls: 'ptc-icon-btn' });
			
			if (isLucideIcon(icon)) {
				// Render Lucide icon from stored prefixed name
				const iconName = getLucideIconName(icon);
				setIcon(iconBtn, iconName);
				iconBtn.setAttribute('title', iconName);
			} else {
				// Render emoji/text
				iconBtn.textContent = icon;
				iconBtn.setAttribute('title', icon);
			}

			iconBtn.addEventListener('click', () => {
				// Already has correct format (with prefix if Lucide)
				this.selectIcon(icon, false);
			});
		});
	}

	private renderLucideIcons(): void {
		if (!this.contentContainer) return;

		const grid = this.contentContainer.createDiv({ cls: 'ptc-icon-grid' });
		
		LUCIDE_ICONS.forEach(iconName => {
			const iconBtn = grid.createEl('button', { cls: 'ptc-icon-btn' });
			setIcon(iconBtn, iconName);
			iconBtn.setAttribute('title', iconName);

			iconBtn.addEventListener('click', () => {
				// Store with lucide: prefix
				this.selectIcon(iconName, true);
			});
		});
	}

	private renderEmojiGrid(emojis: string[]): void {
		if (!this.contentContainer) return;

		const grid = this.contentContainer.createDiv({ cls: 'ptc-icon-grid' });
		
		emojis.forEach(emoji => {
			const iconBtn = grid.createEl('button', { cls: 'ptc-icon-btn' });
			iconBtn.textContent = emoji;
			iconBtn.setAttribute('title', emoji);

			iconBtn.addEventListener('click', () => {
				this.selectIcon(emoji, false);
			});
		});
	}

	private renderSearchResults(): void {
		if (!this.contentContainer) return;

		const query = this.searchQuery.toLowerCase();
		const grid = this.contentContainer.createDiv({ cls: 'ptc-icon-grid' });
		let hasResults = false;

		// Search Lucide icons by name
		LUCIDE_ICONS.forEach(iconName => {
			if (iconName.toLowerCase().includes(query)) {
				hasResults = true;
				const iconBtn = grid.createEl('button', { cls: 'ptc-icon-btn' });
				setIcon(iconBtn, iconName);
				iconBtn.setAttribute('title', iconName);

				iconBtn.addEventListener('click', () => {
					this.selectIcon(iconName, true);
				});
			}
		});

		// Search emoji categories
		EMOJI_CATEGORIES.forEach(category => {
			if (category.name.toLowerCase().includes(query)) {
				category.icons.slice(0, 20).forEach(emoji => {
					hasResults = true;
					const iconBtn = grid.createEl('button', { cls: 'ptc-icon-btn' });
					iconBtn.textContent = emoji;
					iconBtn.setAttribute('title', emoji);

					iconBtn.addEventListener('click', () => {
						this.selectIcon(emoji, false);
					});
				});
			}
		});

		if (!hasResults) {
			grid.remove();
			this.contentContainer.createDiv({ 
				text: 'No icons found', 
				cls: 'ptc-no-results' 
			});
		}
	}

	/**
	 * Select an icon and close the modal
	 * @param icon The icon value
	 * @param isLucideRaw Whether this is a raw Lucide icon name (needs prefix)
	 */
	private selectIcon(icon: string, isLucideRaw: boolean): void {
		// Add lucide: prefix if it's a Lucide icon
		const storedIcon = isLucideRaw ? LUCIDE_PREFIX + icon : icon;
		
		// Add to recent icons
		this.addToRecent(storedIcon);
		
		// Call the callback
		this.onSelect(storedIcon);
		
		// Close modal
		this.close();
	}

	private addToRecent(icon: string): void {
		const recent = this.plugin.settings.recentIcons.filter(i => i !== icon);
		recent.unshift(icon);
		this.plugin.settings.recentIcons = recent.slice(0, MAX_RECENT_ICONS);
		void this.plugin.saveSettings();
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

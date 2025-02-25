import { Plugin, Notice } from 'obsidian';
import { PinnedEmojiSettings } from './types';
import { DEFAULT_PIN_EMOJI, DEFAULT_SETTINGS } from './constants';
import { PinnedEmojiSettingTab } from './PinnedEmojiSettingTab';
import { EmojiPickerModal } from './EmojiPickerModal';

export class PinnedEmojiPlugin extends Plugin {
	settings: PinnedEmojiSettings;
	styleEl: HTMLStyleElement;

	async onload() {
		console.log('Pinned Emoji Plugin loading...');
		await this.loadSettings();

		// Crea el <style> para los mapeos personalizados.
		this.styleEl = document.createElement('style');
		document.head.appendChild(this.styleEl);

		// Actualiza las variables CSS y los estilos dinámicos.
		this.generateDynamicCSS();

		// Registra la pestaña de configuración.
		this.addSettingTab(new PinnedEmojiSettingTab(this.app, this));

		// Registra el menú contextual en las pestañas.
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				menu.addItem((item) => {
					item
						.setTitle('Customize pin')
						.setIcon('edit')
						.onClick(() => {
							const label = file.name.replace(/\.md$/, '');
							new EmojiPickerModal(this.app, label, async (emoji) => {
								const existing = this.settings.labelEmojiMap.find((entry) => entry.label === label);
								if (existing) {
									existing.emoji = emoji;
								} else {
									this.settings.labelEmojiMap.push({ label, emoji });
								}
								await this.saveSettings();
								this.generateDynamicCSS();
								new Notice(`Pinned emoji for "${label}" set to ${emoji}`);
							}).open();
						});
				});
			})
		);
	}

	onunload() {
		console.log('Pinned Emoji Plugin unloading...');
		this.styleEl?.remove();
	}

	async loadSettings(): Promise<void> {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.generateDynamicCSS();
	}

	/**
	 * Actualiza las variables CSS globales y genera reglas dinámicas
	 * para los mapeos personalizados.
	 */
	generateDynamicCSS() {
		// Actualiza las variables globales definidas en :root
		document.documentElement.style.setProperty('--pinned-tab-width', `${this.settings.pinnedTabSize}px`);
		document.documentElement.style.setProperty('--default-pinned-emoji', `"${DEFAULT_PIN_EMOJI}"`);

		// Para cada mapeo personalizado, asigna la variable --custom-emoji en los elementos correspondientes
		this.settings.labelEmojiMap.forEach((pair) => {
			const safeLabel = pair.label.replace(/"/g, '\\"');
			// Actualiza para las pestañas principales
			document.querySelectorAll(`.workspace-tabs .workspace-tab-header[aria-label="${safeLabel}"]`)
				.forEach((el: HTMLElement) => {
					el.style.setProperty('--custom-emoji', `"${pair.emoji}"`);
				});
			// Actualiza para la barra lateral
			document.querySelectorAll(`.workspace-split.mod-horizontal .workspace-tab-header[aria-label="${safeLabel}"]`)
				.forEach((el: HTMLElement) => {
					el.style.setProperty('--custom-emoji', `"${pair.emoji}"`);
				});
		});
	}
}

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

    // Create a <style> element for our dynamic CSS.
    this.styleEl = document.createElement('style');
    document.head.appendChild(this.styleEl);

    // Generate CSS based on current settings.
    this.generateDynamicCSS();

    // Register the plugin's settings tab.
    this.addSettingTab(new PinnedEmojiSettingTab(this.app, this));

    // Register context menu for tabs (the "Customize pin" entry)
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        menu.addItem((item) => {
          item
            .setTitle('Customize pin')
            .setIcon('edit')
            .onClick(() => {
              const label = file.name.replace(/\.md$/, ''); // Get the tab title
              new EmojiPickerModal(this.app, label, async (emoji) => {
                // Save the new emoji
                const existing = this.settings.labelEmojiMap.find(
                  (entry) => entry.label === label
                );
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

  /**
   * Load user settings from disk or use defaults.
   */
  async loadSettings(): Promise<void> {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }

  /**
   * Save user settings and regenerate dynamic CSS.
   */
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.generateDynamicCSS();
  }

  /**
   * Build CSS that customizes pinned tabs:
   * - Sets pinned tab width.
   * - Replaces pinned tab labels with user-chosen emojis.
   * - Adds default "📌" emoji for unmapped pinned tabs.
   */
  generateDynamicCSS() {
	let dynamicCSS = `
		/* Dynamic: ancho de la pestaña según la configuración */
		.workspace-tabs .workspace-tab-header:has(.mod-pinned) {
			max-width: ${this.settings.pinnedTabSize}px !important;
		}

		/* Dynamic: emoji por defecto */
		.workspace-tabs .workspace-tab-header:has(.mod-pinned) .workspace-tab-header-inner-title::after {
			visibility: visible !important;
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			font-size: 1.3em;
			line-height: 1;
			display: block;
			color: inherit;
			content: "${DEFAULT_PIN_EMOJI}";
		}
	`;

	for (const pair of this.settings.labelEmojiMap) {
		const safeLabel = pair.label.replace(/"/g, '\\"');
		dynamicCSS += `
			/* Emoji personalizado para "${pair.label}" */
			.workspace-tabs .workspace-tab-header:has(.mod-pinned)[aria-label="${safeLabel}"] .workspace-tab-header-inner-title::after {
				visibility: visible !important;
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				font-size: 1.3em;
				line-height: 1;
				display: block;
				color: inherit;
				content: "${pair.emoji}";
			}

			/* Emoji para la barra lateral */
			.workspace-split.mod-horizontal .workspace-tab-header[aria-label="${safeLabel}"] .workspace-tab-header-inner-icon svg {
				display: none;
			}

			.workspace-split.mod-horizontal .workspace-tab-header[aria-label="${safeLabel}"] .workspace-tab-header-inner-icon::before {
				content: "${pair.emoji}";
				font-size: 1.2em;
				display: block;
				line-height: 1;
				text-align: center;
				margin: 0 auto;
			}
		`;
	}

	this.styleEl.textContent = dynamicCSS;
  }
}

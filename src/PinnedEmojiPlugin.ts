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

    // Register context menu for tabs (the "Customize Pin" entry)
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        menu.addItem((item) => {
          item
            .setTitle('Customize Pin')
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
    let css = `
      /* Pinned Tab Customizations for Main Bar */
      .workspace-tabs .workspace-tab-header:has(.mod-pinned) {
        max-width: ${this.settings.pinnedTabSize}px !important;
      }

      .workspace-tabs .workspace-tab-header:has(.mod-pinned) .workspace-tab-header-inner-title {
        text-overflow: clip !important;
        visibility: hidden !important;
        position: relative;
      }

      .workspace-tabs .workspace-tab-header:has(.mod-pinned) .workspace-tab-header-status-container {
        display: none !important; /* Hide pinned icon in the main bar */
      }

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
        content: "${DEFAULT_PIN_EMOJI}"; /* Default to pin emoji */
      }

      /* Center the emoji in the tab */
      .workspace-tabs .workspace-tab-header-inner {
        padding-inline-end: 8px;
        padding-inline-start: 8px;
      }

      /* Sidebar Customizations */
      .workspace-split.mod-horizontal .workspace-tab-header:has(.mod-pinned) {
        max-width: 48px !important; /* Fixed width for sidebar pinned tabs */
      }

      .workspace-split.mod-horizontal .workspace-tab-header .workspace-tab-header-status-container {
        display: flex !important; /* Show pinned icon in the sidebar */
      }
    `;

    // Append rules for each label → emoji mapping
    for (const pair of this.settings.labelEmojiMap) {
      const safeLabel = pair.label.replace(/"/g, '\\"');
      css += `
        /* Custom emoji for pinned tabs */
        .workspace-tabs .workspace-tab-header:has(.mod-pinned)[aria-label="${safeLabel}"]
          .workspace-tab-header-inner-title::after {
          content: "${pair.emoji}";
        }

        /* Custom emoji for sidebar icons */
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

    // Apply the updated CSS to the <style> element
    this.styleEl.textContent = css;
  }
}

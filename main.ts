import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  FuzzySuggestModal,
  TFile,
  Notice,
} from 'obsidian';

/** --------------------------------
*  INTERFACES & DEFAULTS
* -------------------------------- */
interface LabelEmojiPair {
  label: string; // The pinned tab's aria-label or file name
  emoji: string; // The emoji to display for this label
}

interface PinnedEmojiSettings {
  pinnedTabSize: number;          // Max width in px for pinned tabs
  labelEmojiMap: LabelEmojiPair[]; // Collection of file→emoji mappings
}

const DEFAULT_SETTINGS: PinnedEmojiSettings = {
  pinnedTabSize: 33,
  labelEmojiMap: [
    { label: 'Home',   emoji: '🏠' },
    { label: 'Tasks',   emoji: '📋' },
    { label: 'Books',     emoji: '📖' },
  ],
};

const DEFAULT_PIN_EMOJI = '📌'; // Default emoji for unmapped pinned tabs

/** 
* A short list of popular emojis for quick selection.
* You can add, remove, or replace these with your own.
*/
const COMMON_EMOJIS: Record<string, string> = {
  '❤️ Heart': '❤️',
  '🤖 Robot': '🤖',
  '🔥 Fire': '🔥',
  '📚 Books': '📚',
  '🎉 Party': '🎉',
  '✏️  Pencil': '✏️',
  '🌟 Star': '🌟',
  '💡 Idea': '💡',
  '✅ Check': '✅',
  '📌 Pin': '📌',
  '⚡ Lightning': '⚡',
};

/** --------------------------------
*  MAIN PLUGIN CLASS
* -------------------------------- */
export default class PinnedEmojiPlugin extends Plugin {
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
  }
  
  onunload() {
    console.log('Pinned Emoji Plugin unloading...');
    this.styleEl?.remove();
  }
  
  /**
  * Load user settings from disk or use defaults.
  */
  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }
  
  /**
  * Save user settings and regenerate dynamic CSS.
  */
  async saveSettings() {
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
      /* Pinned Tab Customizations */
      .workspace-tab-header:has(.mod-pinned) {
        max-width: ${this.settings.pinnedTabSize}px !important;
      }
    
      .workspace-tab-header:has(.mod-pinned) .workspace-tab-header-inner-title {
        text-overflow: clip !important;
        visibility: hidden !important;
        position: relative;
      }
    
      .workspace-tab-header:has(.mod-pinned) .workspace-tab-header-status-container {
        display: none !important;
      }
    
      .workspace-tab-header:has(.mod-pinned) .workspace-tab-header-inner-title::after {
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
    `;
    
    // Append rules for each label → emoji mapping
    for (const pair of this.settings.labelEmojiMap) {
      const safeLabel = pair.label.replace(/"/g, '\\"');
      
      // Custom emoji for pinned tabs
      css += `
        .workspace-tab-header:has(.mod-pinned)[aria-label="${safeLabel}"]
          .workspace-tab-header-inner-title::after {
          content: "${pair.emoji}";
        }
      `;
      
      // Custom emoji for sidebar icons (only for mapped labels)
      css += `
        .workspace-tab-header[aria-label="${safeLabel}"] .workspace-tab-header-inner-icon svg {
          display: none;
        }
  
        .workspace-tab-header[aria-label="${safeLabel}"] .workspace-tab-header-inner-icon::before {
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
/** --------------------------------
*  FILE PICKER MODAL
* --------------------------------
* A fuzzy search for choosing a file from the vault.
*/
class FilePickerModal extends FuzzySuggestModal<TFile> {
  onChooseItemCallback: (file: TFile) => void;
  
  constructor(app: App, onChooseItemCallback: (file: TFile) => void) {
    super(app);
    this.onChooseItemCallback = onChooseItemCallback;
  }
  
  getItems(): TFile[] {
    return this.app.vault.getFiles();
  }
  
  getItemText(item: TFile): string {
    return item.path;
  }
  
  onChooseItem(item: TFile) {
    this.onChooseItemCallback(item);
  }
}

/** --------------------------------
*  SETTINGS TAB
* --------------------------------
* A single settings tab for controlling:
* - pinned tab width
* - file → emoji mappings
*/
class PinnedEmojiSettingTab extends PluginSettingTab {
  plugin: PinnedEmojiPlugin;
  
  /** 
  * Temporary storage while user picks a file + chooses an emoji
  * before actually adding the mapping.
  */
  private tempLabel: string | null = null;  // For the file label
  private tempEmoji: string | null = null;  // For the chosen emoji
  
  constructor(app: App, plugin: PinnedEmojiPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    // Heading
    containerEl.createEl('h1', { text: 'Pinned Tab Settings' });
    
    // 1) Slider: Pinned Tab Width
    new Setting(containerEl)
    .setName('Pinned Tab Width')
    .setDesc(`Max width for pinned tabs. Currently: ${this.plugin.settings.pinnedTabSize}px`)
    .addSlider((slider) => {
      slider
      .setLimits(20, 80, 1)
      .setDynamicTooltip()
      .setValue(this.plugin.settings.pinnedTabSize)
      .onChange(async (val) => {
        this.plugin.settings.pinnedTabSize = val;
        await this.plugin.saveSettings();
      });
    });
    
    // 2) Existing Mappings
    containerEl.createEl('h1', { text: 'Current Mappings' });
    
    new Setting(containerEl)
    .setName('Reset Settings')
    .setDesc('Restore all settings to their default values.')
    .addButton((btn) => {
      btn
      .setIcon('refresh-cw') // Use Lucide icons (e.g., refresh-cw for reset)
      .setButtonText('Reset')
      .setWarning() // Makes the button styled as a warning
      .onClick(async () => {
        console.log('Settings reset to defaults.');
        // Logic for resetting settings here
        this.plugin.settings = DEFAULT_SETTINGS;
        await this.plugin.saveSettings();
        this.display();
        
        // Show a notice to the user
        new Notice('Settings have been reset to their defaults.');
      });
    });
    
    // List existing mappings in collapsible sections
    this.plugin.settings.labelEmojiMap.forEach((mapping, index) => {
      const details = containerEl.createEl('details');
      details.createEl('summary', { text: mapping.label });
      
      // Edit Label
      new Setting(details)
      .setName('File Label')
      .setDesc('The pinned tab label or file name.')
      .addText((text) => {
        text
        .setValue(mapping.label)
        .onChange(async (val) => {
          mapping.label = val;
          await this.plugin.saveSettings();
        });
      });
      
      // Edit Emoji
      new Setting(details)
      .setName('Emoji')
      .setDesc('Which emoji to display for this pinned tab.')
      .addDropdown((dropdown) => {
        // Add a default (empty) option and the common emojis
        dropdown.addOption('', '— Pick an emoji —');
        for (const [label, emoji] of Object.entries(COMMON_EMOJIS)) {
          dropdown.addOption(emoji, `${label} (${emoji})`);
        }
        // Also set an "Other" option if user wants to type their own
        dropdown.addOption('other', 'Type your own...');
        dropdown.setValue(
          Object.values(COMMON_EMOJIS).includes(mapping.emoji) ? mapping.emoji : 'other'
        );
        
        dropdown.onChange(async (val) => {
          if (val === 'other') {
            // If user picks "other," do nothing — we'll rely on the text field below.
          } else {
            mapping.emoji = val;
            await this.plugin.saveSettings();
            this.display(); // refresh to show updated text
          }
        });
      })
      .addText((text) => {
        text
        .setPlaceholder('Or paste your own emoji')
        .setValue(mapping.emoji)
        .onChange(async (val) => {
          mapping.emoji = val;
          await this.plugin.saveSettings();
        });
      });
      
      // Remove Mapping
      new Setting(details)
      .addButton((btn) => {
        btn
        .setButtonText('Remove Mapping')
        .setWarning()
        .onClick(async () => {
          this.plugin.settings.labelEmojiMap.splice(index, 1);
          await this.plugin.saveSettings();
          this.display();
        });
      });
    });
    
    // 3) Add a New Mapping
    containerEl.createEl('h1', { text: 'Add a New Mapping' });
    
    // Step 1: Pick a file
    new Setting(containerEl)
    .setName('Pick a File')
    .setDesc(this.tempLabel ? `Chosen: ${this.tempLabel}` : 'No file chosen yet.')
    .addButton((btn) => {
      btn
      .setButtonText('Choose File')
      .onClick(() => {
        new FilePickerModal(this.app, (file) => {
          // Remove .md extension from the file name
          const label = file.name.replace(/\.md$/, '');
          this.tempLabel = label;
          this.display(); // Refresh the UI
        }).open();
      });
    });
    
    // Step 2: Choose an emoji
    new Setting(containerEl)
    .setName('Choose an Emoji')
    .setDesc(this.tempEmoji ? `Emoji: ${this.tempEmoji}` : 'No emoji chosen yet.')
    .addDropdown((dropdown) => {
      dropdown.addOption('', '— Pick an emoji —');
      for (const [label, emoji] of Object.entries(COMMON_EMOJIS)) {
        dropdown.addOption(emoji, `${label} (${emoji})`);
      }
      dropdown.setValue('');
      
      dropdown.onChange((val) => {
        if (val !== '') {
          this.tempEmoji = val;
          this.display();
        }
      });
    })
    .addText((text) => {
      text
      .setPlaceholder('Or put your own emoji')
      .setValue(this.tempEmoji || '') // Show current emoji(s) in text input
      .onChange((val) => {
        this.tempEmoji = val;
        this.display(); // show the newly typed emoji in the desc
      });
    });
    
    // Step 3: Add the mapping once both are chosen
    new Setting(containerEl)
    .setName('Add Mapping')
    .setDesc('When both file & emoji are chosen, click to add.')
    .addButton((btn) => {
      btn
      .setButtonText('Add Mapping')
      .setCta()
      .onClick(async () => {
        if (!this.tempLabel || !this.tempEmoji) {
          new Notice('Please choose both a file and an emoji first!');
          return;
        }
        // Create a new mapping
        this.plugin.settings.labelEmojiMap.push({
          label: this.tempLabel,
          emoji: this.tempEmoji,
        });
        await this.plugin.saveSettings();
        
        // Reset temp fields
        this.tempLabel = null;
        this.tempEmoji = null;
        this.display();
        new Notice('New mapping added!');
      });
    });
  }
}

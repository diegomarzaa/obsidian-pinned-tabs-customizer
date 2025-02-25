import { App, PluginSettingTab, Setting } from 'obsidian';
import { PinnedEmojiPlugin } from './PinnedEmojiPlugin';
import { EmojiPickerModal } from './EmojiPickerModal';
import { FilePickerModal } from './FilePickerModal';

/** --------------------------------
 *    SETTINGS TAB
 * --------------------------------
 * A single settings tab for controlling:
 * - pinned tab width
 * - file → emoji mappings
 */

export class PinnedEmojiSettingTab extends PluginSettingTab {
    plugin: PinnedEmojiPlugin;

    constructor(app: App, plugin: PinnedEmojiPlugin) {
super(app, plugin);
this.plugin = plugin;
    }

    display(): void {
const { containerEl } = this;
containerEl.empty();

new Setting(containerEl)
    .setName("Pinned tab width")
    .setDesc("Set the width of pinned tabs in pixels.")
    .addSlider((slider) =>
slider
    .setLimits(20, 80, 1)
    .setValue(this.plugin.settings.pinnedTabSize)
    .onChange(async (value) => {
this.plugin.settings.pinnedTabSize = value;
await this.plugin.saveSettings();
    })
    );

const mappingContainer = containerEl.createEl("div", { cls: "mapping-container" });

this.plugin.settings.labelEmojiMap.forEach((mapping, index) => {
    const card = mappingContainer.createEl("div", { cls: "mapping-card" });

    const labelInput = card.createEl("input", {
type: "text",
value: mapping.label,
cls: "label-input",
    });
    labelInput.onblur = async () => {
mapping.label = labelInput.value;
await this.plugin.saveSettings();
    };

    const emojiButton = card.createEl("button", {
text: mapping.emoji || "Pick emoji",
cls: "emoji-button",
    });
    emojiButton.onclick = () => {
new EmojiPickerModal(this.app, mapping.label, async (emoji) => {
    mapping.emoji = emoji;
    emojiButton.textContent = emoji;
    await this.plugin.saveSettings();
}).open();
    };

    const fileButton = card.createEl("button", {
text: "Pick file",
cls: "file-button",
    });
    fileButton.onclick = () => {
new FilePickerModal(this.app, async (file) => {
    mapping.label = file.name.replace(/\.md$/, "");
    labelInput.value = mapping.label;
    await this.plugin.saveSettings();
}).open();
    };

    const deleteButton = card.createEl("button", {
text: "Delete",
cls: "delete-button",
    });
    deleteButton.onclick = async () => {
this.plugin.settings.labelEmojiMap.splice(index, 1);
await this.plugin.saveSettings();
this.display();
    };
});

new Setting(containerEl)
    .setName("Add new mapping")
    .addButton((btn) =>
btn.setButtonText("Add").onClick(async () => {
    this.plugin.settings.labelEmojiMap.push({ label: "New Tab", emoji: "📌" });
    await this.plugin.saveSettings();
    this.display();
})
    );

containerEl.createEl("style", {
    text: `
.mapping-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 10px;
}
.mapping-card {
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.label-input {
    width: 100%;
}
.emoji-button, .file-button, .delete-button {
    padding: 5px;
    border-radius: 5px;
}
.delete-button {
    background: var(--interactive-critical);
    color: var(--text-on-accent);
}
    `,
});
    }
}

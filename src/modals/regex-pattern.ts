import { App, Modal, Setting } from 'obsidian';

/**
 * Modal for entering a regex pattern
 */
export class RegexPatternModal extends Modal {
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

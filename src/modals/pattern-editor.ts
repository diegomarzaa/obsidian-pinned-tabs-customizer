import { App, Modal, Setting, TFile } from 'obsidian';
import type { PatternType } from '../types';
import { PATTERN_PRESETS, PATTERN_TYPE_LABELS, PATTERN_TYPE_DESCRIPTIONS } from '../pattern-presets';

/**
 * Test if a filename matches a pattern
 */
export function testPattern(fileName: string, type: PatternType, pattern: string): boolean {
	if (!pattern) return false;
	
	switch (type) {
		case 'exact':
			return fileName === pattern;
		case 'starts-with':
			return fileName.startsWith(pattern);
		case 'ends-with':
			return fileName.endsWith(pattern);
		case 'contains':
			return fileName.includes(pattern);
		case 'regex':
			try {
				const regex = new RegExp(pattern);
				return regex.test(fileName);
			} catch {
				return false;
			}
		case 'folder':
			// Folder matching is done on path, not filename
			return false;
		default:
			return false;
	}
}

/**
 * Enhanced pattern editor modal with simple modes, presets, and live preview
 */
export class PatternEditorModal extends Modal {
	private patternType: PatternType;
	private pattern: string;
	private onSubmit: (type: PatternType, pattern: string) => void;
	
	private previewContainer: HTMLElement | null = null;
	private testResultEl: HTMLElement | null = null;
	private matchCountEl: HTMLElement | null = null;
	private testValue: string = '';

	constructor(
		app: App,
		initialType: PatternType,
		initialPattern: string,
		onSubmit: (type: PatternType, pattern: string) => void
	) {
		super(app);
		this.patternType = initialType === 'folder' ? 'starts-with' : initialType;
		this.pattern = initialPattern;
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('ptc-pattern-editor');

		// Title
		contentEl.createEl('h2', { text: 'Pattern editor' });

		// Presets section (collapsible)
		this.renderPresets(contentEl);

		// Pattern type selector
		new Setting(contentEl)
			.setName('Match type')
			.setDesc(PATTERN_TYPE_DESCRIPTIONS[this.patternType] || '')
			.addDropdown(dropdown => {
				// Add options excluding 'folder' (that's handled separately)
				const types: PatternType[] = ['exact', 'starts-with', 'ends-with', 'contains', 'regex'];
				types.forEach(type => {
					dropdown.addOption(type, PATTERN_TYPE_LABELS[type] || type);
				});
				dropdown.setValue(this.patternType);
				dropdown.onChange((value) => {
					this.patternType = value as PatternType;
					this.updatePreview();
					// Refresh the modal to update description
					this.onOpen();
				});
			});

		// Pattern input
		const patternSetting = new Setting(contentEl)
			.setName('Pattern')
			.setDesc(this.getPatternPlaceholder());
		
		patternSetting.addText(text => {
			text
				.setPlaceholder(this.getPatternPlaceholder())
				.setValue(this.pattern)
				.onChange(value => {
					this.pattern = value;
					this.updatePreview();
					this.updateTestResult(this.testValue);
				});
			text.inputEl.addClass('ptc-pattern-input');
			// Auto-focus
			setTimeout(() => text.inputEl.focus(), 50);
		});

		// Regex reference (only shown when regex is selected)
		if (this.patternType === 'regex') {
			this.renderRegexReference(contentEl);
		}

		// Test input section
		const testSection = contentEl.createDiv({ cls: 'ptc-test-section' });
		testSection.createEl('h4', { text: 'Test your pattern' });
		
		const testSetting = new Setting(testSection)
			.setName('Test filename')
			.setDesc('Enter a filename to check if it matches');
		
		testSetting.addText(text => {
			text
				.setPlaceholder('2024-01-15 or meeting-notes')
				.onChange(value => {
					this.testValue = value;
					this.updateTestResult(value);
				});
			text.inputEl.addClass('ptc-test-input');
		});

		this.testResultEl = testSection.createDiv({ cls: 'ptc-test-result' });

		// Live preview section
		const previewSection = contentEl.createDiv({ cls: 'ptc-preview-section' });
		const previewHeader = previewSection.createDiv({ cls: 'ptc-preview-header' });
		previewHeader.createEl('h4', { text: 'Matching files' });
		this.matchCountEl = previewHeader.createEl('span', { cls: 'ptc-match-count' });
		
		this.previewContainer = previewSection.createDiv({ cls: 'ptc-preview-list' });
		this.updatePreview();

		// Action buttons
		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Save pattern')
				.setCta()
				.onClick(() => {
					if (this.pattern.trim()) {
						this.onSubmit(this.patternType, this.pattern);
						this.close();
					}
				}))
			.addButton(btn => btn
				.setButtonText('Cancel')
				.onClick(() => this.close()));
	}

	private renderPresets(container: HTMLElement): void {
		const presetsSection = container.createDiv({ cls: 'ptc-presets-section' });
		
		const presetsHeader = presetsSection.createDiv({ cls: 'ptc-presets-header' });
		presetsHeader.textContent = 'Quick patterns';
		
		const presetsGrid = presetsSection.createDiv({ cls: 'ptc-presets-grid' });
		
		PATTERN_PRESETS.forEach(preset => {
			const presetBtn = presetsGrid.createDiv({ cls: 'ptc-preset-btn' });
			presetBtn.createEl('span', { text: preset.icon, cls: 'ptc-preset-icon' });
			presetBtn.createEl('span', { text: preset.name, cls: 'ptc-preset-name' });
			presetBtn.setAttribute('title', preset.description);
			
			presetBtn.addEventListener('click', () => {
				this.patternType = preset.type;
				this.pattern = preset.pattern;
				this.onOpen(); // Refresh the modal
			});
		});
	}

	private getPatternPlaceholder(): string {
		switch (this.patternType) {
			case 'exact':
				return 'Exact filename (e.g., Home)';
			case 'starts-with':
				return 'Text to match at start (e.g., Meeting)';
			case 'ends-with':
				return 'Text to match at end (e.g., -notes)';
			case 'contains':
				return 'Text to find anywhere (e.g., project)';
			case 'regex':
				return 'Regular expression (e.g., ^\\d{4}-\\d{2}-\\d{2}$)';
			default:
				return 'Enter pattern';
		}
	}

	private renderRegexReference(container: HTMLElement): void {
		const details = container.createEl('details', { cls: 'ptc-regex-reference' });
		details.createEl('summary', { text: 'Regex reference' });
		
		const content = details.createDiv({ cls: 'ptc-regex-content' });
		
		const table = content.createEl('table');
		const patterns = [
			['^', 'Start of filename'],
			['$', 'End of filename'],
			['.', 'Any single character'],
			['\\d', 'Any digit (0-9)'],
			['\\w', 'Any word character (a-z, 0-9, _)'],
			['\\s', 'Any whitespace'],
			['*', 'Zero or more of previous'],
			['+', 'One or more of previous'],
			['?', 'Zero or one of previous'],
			['{n}', 'Exactly n of previous'],
			['[abc]', 'Any of a, b, or c'],
			['[^abc]', 'Not a, b, or c'],
			['(a|b)', 'Either a or b'],
		];
		
		patterns.forEach(([pattern, desc]) => {
			const row = table.createEl('tr');
			row.createEl('td', { text: pattern, cls: 'ptc-regex-pattern-cell' });
			row.createEl('td', { text: desc });
		});

		content.createEl('p', { 
			text: 'Examples:', 
			cls: 'ptc-regex-examples-title' 
		});
		
		const examples = content.createEl('ul', { cls: 'ptc-regex-examples' });
		const exampleList = [
			// Date patterns
			['^\\d{4}-\\d{2}-\\d{2}$', 'Daily notes (2024-01-15)'],
			['^\\d{4}-\\d{2}$', 'Monthly notes (2024-01)'],
			['^\\d{4}-W\\d{2}$', 'Weekly notes (2024-W03)'],
			['^\\d{4}-Q[1-4]$', 'Quarterly notes (2024-Q1)'],
			// Start/end matching
			['^Meeting', 'Starts with "Meeting"'],
			['^@', 'Starts with @ (people notes)'],
			['notes$', 'Ends with "notes"'],
			['-draft$', 'Ends with "-draft"'],
			// Contains
			['project', 'Contains "project" anywhere'],
			['\\d+', 'Contains any number'],
			// Multiple options
			['(TODO|FIXME|WIP)', 'Contains TODO, FIXME, or WIP'],
			['^(Home|Index|Dashboard)$', 'Exactly Home, Index, or Dashboard'],
			// Case insensitive (using character class)
			['[Rr]eadme', 'Readme or readme'],
			['^[Ii]ndex$', 'Index or index (exact)'],
			// Special patterns
			['^\\d', 'Starts with a number'],
			['^[A-Z]', 'Starts with uppercase letter'],
			['\\s', 'Contains a space'],
			['^[^_]', 'Does NOT start with underscore'],
		];
		
		exampleList.forEach(([pattern, desc]) => {
			const li = examples.createEl('li');
			li.createEl('code', { text: pattern });
			li.createSpan({ text: ` — ${desc}` });
		});
	}

	private updateTestResult(testValue: string): void {
		if (!this.testResultEl) return;
		this.testResultEl.empty();

		if (!testValue) {
			this.testResultEl.textContent = '';
			return;
		}

		const matches = testPattern(testValue, this.patternType, this.pattern);
		
		if (matches) {
			this.testResultEl.addClass('ptc-test-match');
			this.testResultEl.removeClass('ptc-test-no-match');
			this.testResultEl.textContent = `✓ "${testValue}" matches!`;
		} else {
			this.testResultEl.removeClass('ptc-test-match');
			this.testResultEl.addClass('ptc-test-no-match');
			this.testResultEl.textContent = `✗ "${testValue}" does not match`;
		}
	}

	private updatePreview(): void {
		if (!this.previewContainer || !this.matchCountEl) return;
		this.previewContainer.empty();

		if (!this.pattern) {
			this.matchCountEl.textContent = '';
			this.previewContainer.createDiv({
				text: 'Enter a pattern to see matching files',
				cls: 'ptc-preview-empty'
			});
			return;
		}

		// Find matching files
		const allFiles = this.app.vault.getMarkdownFiles();
		const matchingFiles: TFile[] = [];

		for (const file of allFiles) {
			if (testPattern(file.basename, this.patternType, this.pattern)) {
				matchingFiles.push(file);
				if (matchingFiles.length >= 20) break; // Limit preview
			}
		}

		// Update count
		const totalMatches = allFiles.filter(f => 
			testPattern(f.basename, this.patternType, this.pattern)
		).length;
		
		this.matchCountEl.textContent = totalMatches > 0 
			? `(${totalMatches} file${totalMatches !== 1 ? 's' : ''})` 
			: '(no matches)';

		if (matchingFiles.length === 0) {
			this.previewContainer.createDiv({
				text: 'No files match this pattern',
				cls: 'ptc-preview-empty'
			});
			return;
		}

		// Render matching files
		matchingFiles.forEach(file => {
			const fileEl = this.previewContainer!.createDiv({ cls: 'ptc-preview-file' });
			fileEl.createEl('span', { text: '📄', cls: 'ptc-preview-file-icon' });
			
			const nameEl = fileEl.createEl('span', { cls: 'ptc-preview-file-name' });
			nameEl.textContent = file.basename;
			
			if (file.parent && file.parent.path !== '/') {
				fileEl.createEl('span', { 
					text: file.parent.path, 
					cls: 'ptc-preview-file-path' 
				});
			}
		});

		if (totalMatches > 20) {
			this.previewContainer.createDiv({
				text: `...and ${totalMatches - 20} more files`,
				cls: 'ptc-preview-more'
			});
		}
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

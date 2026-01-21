import type { PatternPreset } from './types';

/**
 * Common pattern presets for quick setup
 */
export const PATTERN_PRESETS: PatternPreset[] = [
	{
		name: 'Daily notes',
		description: 'YYYY-MM-DD format (2024-01-15)',
		type: 'regex',
		pattern: '^\\d{4}-\\d{2}-\\d{2}$',
		icon: '📅'
	},
	{
		name: 'Weekly notes',
		description: 'YYYY-Www format (2024-W03)',
		type: 'regex',
		pattern: '^\\d{4}-W\\d{2}$',
		icon: '📆'
	},
	{
		name: 'Monthly notes',
		description: 'YYYY-MM format (2024-01)',
		type: 'regex',
		pattern: '^\\d{4}-\\d{2}$',
		icon: '🗓️'
	},
	{
		name: 'Quarterly notes',
		description: 'YYYY-Qn format (2024-Q1)',
		type: 'regex',
		pattern: '^\\d{4}-Q[1-4]$',
		icon: '📊'
	},
	{
		name: 'Meeting notes',
		description: 'Files starting with "Meeting"',
		type: 'starts-with',
		pattern: 'Meeting',
		icon: '👥'
	},
	{
		name: 'Index files',
		description: 'Files named "Index" or "index"',
		type: 'regex',
		pattern: '^[Ii]ndex$',
		icon: '📑'
	},
	{
		name: 'README files',
		description: 'Files named README',
		type: 'exact',
		pattern: 'README',
		icon: '📖'
	},
	{
		name: 'Templates',
		description: 'Files starting with "Template"',
		type: 'starts-with',
		pattern: 'Template',
		icon: '📋'
	},
	{
		name: 'Archive files',
		description: 'Files containing "archive"',
		type: 'contains',
		pattern: 'archive',
		icon: '🗃️'
	},
	{
		name: 'Todo/Task files',
		description: 'Files with TODO or Task',
		type: 'regex',
		pattern: '(TODO|[Tt]ask)',
		icon: '✅'
	}
];

/**
 * Human-readable labels for pattern types
 */
export const PATTERN_TYPE_LABELS: Record<string, string> = {
	'exact': 'Exact match',
	'folder': 'Folder',
	'starts-with': 'Starts with',
	'ends-with': 'Ends with',
	'contains': 'Contains',
	'regex': 'Regex (advanced)'
};

/**
 * Descriptions for each pattern type
 */
export const PATTERN_TYPE_DESCRIPTIONS: Record<string, string> = {
	'exact': 'Matches file names exactly (case-sensitive)',
	'folder': 'Matches all files in a folder and subfolders',
	'starts-with': 'Matches files that start with this text',
	'ends-with': 'Matches files that end with this text',
	'contains': 'Matches files containing this text anywhere',
	'regex': 'Use a regular expression for complex patterns'
};

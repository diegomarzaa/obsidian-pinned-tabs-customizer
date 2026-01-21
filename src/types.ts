/**
 * Pattern match types
 */
export type PatternType = 'exact' | 'folder' | 'starts-with' | 'ends-with' | 'contains' | 'regex';

/**
 * Icon mapping for custom icons per file/folder/pattern
 */
export interface IconMapping {
	type: PatternType;
	match: string;
	icon: string;
}

/**
 * Pattern preset definition
 */
export interface PatternPreset {
	name: string;
	description: string;
	type: PatternType;
	pattern: string;
	icon: string;
}

/**
 * Plugin settings interface
 */
export interface PinnedTabsCustomizerSettings {
	shrinkPinnedTabs: boolean;
	pinnedTabWidth: number;
	showDefaultIcon: boolean;
	defaultIcon: string;
	enableFrontmatter: boolean;
	frontmatterProperty: string;
	iconMappings: IconMapping[];
	recentIcons: string[]; // Track recently used icons
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: PinnedTabsCustomizerSettings = {
	shrinkPinnedTabs: false,
	pinnedTabWidth: 40,
	showDefaultIcon: true,
	defaultIcon: '', // Empty = native Obsidian pin icon
	enableFrontmatter: true,
	frontmatterProperty: 'pinned-icon',
	iconMappings: [],
	recentIcons: []
};

/**
 * Special marker for native Obsidian pin icon
 */
export const NATIVE_PIN_ICON = '__native_pin__';

/**
 * Prefix for Lucide icons
 */
export const LUCIDE_PREFIX = 'lucide:';

/**
 * Maximum number of recent icons to track
 */
export const MAX_RECENT_ICONS = 12;

/**
 * Check if an icon string is a Lucide icon
 */
export function isLucideIcon(icon: string): boolean {
	return icon.startsWith(LUCIDE_PREFIX);
}

/**
 * Get the Lucide icon name from a prefixed string
 */
export function getLucideIconName(icon: string): string {
	return icon.slice(LUCIDE_PREFIX.length);
}

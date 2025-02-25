/** --------------------------------
 *    CONSTANTS & DEFAULT SETTINGS
 * -------------------------------- */

import type { PinnedEmojiSettings } from './types';

/** 
 * Default emoji for unmapped pinned tabs
 */
export const DEFAULT_PIN_EMOJI = '📌';

/**
 * Default settings for the plugin
 */
export const DEFAULT_SETTINGS: PinnedEmojiSettings = {
    pinnedTabSize: 33,
    labelEmojiMap: [
        { label: 'Home',    emoji: '🏠' },
        { label: 'Tasks', emoji: '📋' },
        { label: 'Books', emoji: '📖' },
    ],
};


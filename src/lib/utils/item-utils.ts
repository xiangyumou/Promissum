/**
 * Item utilities
 *
 * Pure functions for item-related operations.
 * Eliminates duplicate logic across components.
 */

import type { ItemMetadata } from '@/lib/types';

/**
 * Get display title for an item
 * Returns custom title if set, otherwise returns type label
 */
export function getItemDisplayTitle(
    item: { type: string; metadata?: ItemMetadata | null },
    t: (key: string) => string
): string {
    return item.metadata?.title ||
        (item.type === 'text' ? t('textNote') : t('image'));
}

/**
 * Check if an item is unlocked (decrypt time has passed)
 */
export function isItemUnlocked(decryptAt: number): boolean {
    return Date.now() >= decryptAt;
}

/**
 * Get time remaining until unlock (in milliseconds)
 */
export function getUnlockTimeRemaining(decryptAt: number): number {
    return Math.max(0, decryptAt - Date.now());
}

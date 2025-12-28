/**
 * Date Range Filter Utilities
 * 
 * Helper functions for time-based filtering
 */

import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export type TimeRangePreset = 'today' | 'thisWeek' | 'thisMonth' | 'custom';

/**
 * Get date range for a preset
 * @param preset Time range preset
 * @param customRange Optional custom range for 'custom' preset
 * @returns Date range in milliseconds
 */
export function getDateRange(
    preset: TimeRangePreset,
    customRange?: { start: number; end: number }
): { start: number; end: number } {
    const now = Date.now();

    switch (preset) {
        case 'today':
            return {
                start: startOfDay(now).getTime(),
                end: endOfDay(now).getTime(),
            };

        case 'thisWeek':
            return {
                start: startOfWeek(now, { weekStartsOn: 1 }).getTime(), // Monday
                end: endOfWeek(now, { weekStartsOn: 1 }).getTime(),
            };

        case 'thisMonth':
            return {
                start: startOfMonth(now).getTime(),
                end: endOfMonth(now).getTime(),
            };

        case 'custom':
            if (!customRange) {
                throw new Error('Custom range requires start and end dates');
            }
            return customRange;

        default:
            throw new Error(`Unknown time range preset: ${preset}`);
    }
}

/**
 * Check if a timestamp falls within a date range
 * @param timestamp Timestamp to check (ms)
 * @param range Date range
 * @returns True if timestamp is within range
 */
export function isInDateRange(
    timestamp: number,
    range: { start: number; end: number }
): boolean {
    return timestamp >= range.start && timestamp <= range.end;
}

/**
 * Get quick filter date ranges
 */
export const QUICK_FILTERS = {
    /**
     * Items unlocking within 24 hours
     */
    unlockingSoon: () => {
        const now = Date.now();
        return {
            start: now,
            end: now + 24 * 60 * 60 * 1000, // +24 hours
        };
    },

    /**
     * Items locked for more than 7 days
     */
    longLocked: () => {
        const now = Date.now();
        return {
            start: now + 7 * 24 * 60 * 60 * 1000, // +7 days
            end: Infinity,
        };
    },

    /**
     * Items created in last 24 hours
     */
    recent: () => {
        const now = Date.now();
        return {
            start: now - 24 * 60 * 60 * 1000, // -24 hours
            end: now,
        };
    },
} as const;

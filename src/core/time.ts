/**
 * Core Time Module
 *
 * All time-related utilities in one place.
 * Replaces: utils/unlock-time.ts + utils/item-utils.ts
 */

import { MS_PER_MINUTE } from '@/lib/constants';

// ============================================
// Types
// ============================================

export interface AbsoluteTime {
    year: string;
    month: string;
    day: string;
    hour: string;
    minute: string;
}

export interface UnlockTimeInfo {
    unlockDate: Date;
    formatted: string; // MM-DD HH:mm format
    remaining: string; // e.g., "1d 2h 30m"
    isValid: boolean;
    errorReason?: 'past' | 'incomplete' | null;
}

// ============================================
// Item State (from item-utils.ts)
// ============================================

/**
 * Check if an item is unlocked (decrypt time has passed)
 */
export function isUnlocked(decryptAt: number): boolean {
    return Date.now() >= decryptAt;
}

/**
 * Get time remaining until unlock (in milliseconds)
 */
export function getTimeRemaining(decryptAt: number): number {
    return Math.max(0, decryptAt - Date.now());
}

// ============================================
// Duration Calculation (from unlock-time.ts)
// ============================================

function parseYear(yearInput: string): number {
    const year = parseInt(yearInput, 10);

    if (year >= 1000) {
        return year;
    }

    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    const fullYear = currentCentury + year;

    if (fullYear < currentYear - 30) {
        return fullYear + 100;
    }

    return fullYear;
}

export function calculateDurationMinutes(
    timeMode: 'duration' | 'absolute',
    accumulatedDuration: number,
    absoluteTime: AbsoluteTime,
    currentTime: number = Date.now()
): number {
    if (timeMode === 'duration') {
        return accumulatedDuration;
    } else {
        const year = parseYear(absoluteTime.year);
        const month = parseInt(absoluteTime.month) - 1;
        const day = parseInt(absoluteTime.day);
        const hour = parseInt(absoluteTime.hour);
        const minute = parseInt(absoluteTime.minute);

        const targetDate = new Date(year, month, day, hour, minute);
        const diffMs = targetDate.getTime() - currentTime;
        return Math.ceil(diffMs / MS_PER_MINUTE);
    }
}

export function calculateUnlockTimeInfo(
    calculatedDuration: number,
    timeMode: 'duration' | 'absolute',
    absoluteTime: AbsoluteTime,
    currentTime: number = Date.now()
): UnlockTimeInfo {
    let unlockDate: Date;
    let diffMs: number;
    let errorReason: 'past' | 'incomplete' | null = null;

    if (timeMode === 'absolute') {
        const hasIncompleteInput = !absoluteTime.year || !absoluteTime.month || !absoluteTime.day ||
            !absoluteTime.hour || !absoluteTime.minute;

        if (hasIncompleteInput) {
            errorReason = 'incomplete';
        }

        const year = parseYear(absoluteTime.year);
        const month = parseInt(absoluteTime.month) - 1;
        const day = parseInt(absoluteTime.day);
        const hour = parseInt(absoluteTime.hour);
        const minute = parseInt(absoluteTime.minute);
        unlockDate = new Date(year, month, day, hour, minute);
        diffMs = unlockDate.getTime() - currentTime;

        if (!errorReason && diffMs < MS_PER_MINUTE) {
            errorReason = 'past';
        }
    } else {
        unlockDate = new Date(currentTime + calculatedDuration * 60 * 1000);
        diffMs = unlockDate.getTime() - currentTime;
    }

    const monthStr = (unlockDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = unlockDate.getDate().toString().padStart(2, '0');
    const hourStr = unlockDate.getHours().toString().padStart(2, '0');
    const minuteStr = unlockDate.getMinutes().toString().padStart(2, '0');

    const totalMinutes = Math.ceil(diffMs / MS_PER_MINUTE);
    const isValid = totalMinutes >= 1 && !errorReason;

    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const mins = totalMinutes % 60;

    let remaining = '';
    if (days > 0) remaining += `${days}d `;
    if (hours > 0) remaining += `${hours}h `;
    remaining += `${mins}m`;

    return {
        unlockDate,
        formatted: `${monthStr}-${dayStr} ${hourStr}:${minuteStr}`,
        remaining: remaining.trim(),
        isValid,
        errorReason
    };
}

// ============================================
// Formatting
// ============================================

export function getRelativeTimeRemaining(decryptAt: number, now: number = Date.now()): string {
    const diff = decryptAt - now;

    if (diff <= 0) return 'Unlocked';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h`;
    }

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

export function formatUnlockTime(timestamp: number, locale: string = 'en'): string {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export function formatTime(ms: number): string {
    if (ms <= 0) return '00:00:00';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (days > 0) {
        return `${days}d ${pad(hours % 24)}:${pad(minutes % 60)}:${pad(seconds % 60)}`;
    }
    return `${pad(hours)}:${pad(minutes % 60)}:${pad(seconds % 60)}`;
}

// ============================================
// Display Helpers (from item-utils.ts)
// ============================================

export function getItemDisplayTitle(
    item: { type: string; metadata?: { title?: string } | null },
    t: (key: string) => string
): string {
    return item.metadata?.title ||
        (item.type === 'text' ? t('textNote') : t('image'));
}

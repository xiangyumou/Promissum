/**
 * Unlock Time Utilities
 *
 * Pure functions for calculating unlock durations and formatting.
 * Extracted from AddModal.tsx to enable unit testing without UI dependencies.
 */

import { timeService } from '@/lib/services/time-service';
import { MS_PER_MINUTE } from '@/lib/constants';

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
    isValid: boolean;  // whether duration is at least 1 minute/future
    errorReason?: 'past' | 'incomplete' | null; // specific error reason
}

/**
 * Parse year input into a full 4-digit year.
 * Handles both 2-digit and 4-digit inputs intelligently.
 */
function parseYear(yearInput: string): number {
    const year = parseInt(yearInput, 10);

    // If already 4 digits, use as-is
    if (year >= 1000) {
        return year;
    }

    // For 2-digit years, infer the century based on current year
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    const fullYear = currentCentury + year;

    // If the result is more than 30 years in the past, assume next century
    // This handles the "year 2000 problem" for dates like "95" -> 2095 (when current year is 2025)
    if (fullYear < currentYear - 30) {
        return fullYear + 100;
    }

    return fullYear;
}

/**
 * Calculate duration in minutes based on duration input or absolute time selection.
 *
 * @param timeMode 'duration' (relative minutes) or 'absolute' (specific date)
 * @param accumulatedDuration Current relative duration in minutes
 * @param absoluteTime The target absolute time object
 * @param currentTime Optional specific current time (defaults to timeService.now())
 */
export function calculateDurationMinutes(
    timeMode: 'duration' | 'absolute',
    accumulatedDuration: number,
    absoluteTime: AbsoluteTime,
    currentTime: number = timeService.now()
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

/**
 * Calculate unlock date info based on duration or absolute time.
 * This is effectively the reverse or verification of calculateDurationMinutes,
 * used for display purposes.
 */
export function calculateUnlockTimeInfo(
    calculatedDuration: number,
    timeMode: 'duration' | 'absolute',
    absoluteTime: AbsoluteTime,
    currentTime: number = timeService.now()
): UnlockTimeInfo {
    let unlockDate: Date;
    let diffMs: number;
    let errorReason: 'past' | 'incomplete' | null = null;

    if (timeMode === 'absolute') {
        // Check for incomplete absolute time input
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

        // Check if time is in the past
        if (!errorReason && diffMs < MS_PER_MINUTE) {
            errorReason = 'past';
        }
    } else {
        unlockDate = new Date(currentTime + calculatedDuration * 60 * 1000);
        // Recalculate diff to be precise
        diffMs = unlockDate.getTime() - currentTime;
    }

    const monthStr = (unlockDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = unlockDate.getDate().toString().padStart(2, '0');
    const hourStr = unlockDate.getHours().toString().padStart(2, '0');
    const minuteStr = unlockDate.getMinutes().toString().padStart(2, '0');

    // Calculate remaining string
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

/**
 * Get a concise relative time remaining string (e.g., "2d 4h", "5h 30m", "45m").
 * Used for compact displays like lists/cards.
 */
export function getRelativeTimeRemaining(decryptAt: number, now: number = timeService.now()): string {
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

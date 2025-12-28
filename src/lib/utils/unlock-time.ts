/**
 * Unlock Time Utilities
 *
 * Pure functions for calculating unlock durations and formatting.
 * Extracted from AddModal.tsx to enable unit testing without UI dependencies.
 */

import { timeService } from '@/lib/services/time-service';

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
        return Math.max(1, accumulatedDuration);
    } else {
        const year = parseInt(absoluteTime.year) + 2000;
        const month = parseInt(absoluteTime.month) - 1;
        const day = parseInt(absoluteTime.day);
        const hour = parseInt(absoluteTime.hour);
        const minute = parseInt(absoluteTime.minute);

        const targetDate = new Date(year, month, day, hour, minute);
        const diffMs = targetDate.getTime() - currentTime;
        return Math.ceil(diffMs / 60000);
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

    if (timeMode === 'absolute') {
        const year = parseInt(absoluteTime.year) + 2000;
        const month = parseInt(absoluteTime.month) - 1;
        const day = parseInt(absoluteTime.day);
        const hour = parseInt(absoluteTime.hour);
        const minute = parseInt(absoluteTime.minute);
        unlockDate = new Date(year, month, day, hour, minute);
        diffMs = unlockDate.getTime() - currentTime;
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
    const totalMinutes = Math.ceil(diffMs / 60000);
    const isValid = totalMinutes >= 1;

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
        isValid
    };
}

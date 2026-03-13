/**
 * Time utilities
 * Simple helper functions for time calculations.
 */

/**
 * Check if a target time has passed (is unlocked)
 */
export function isTimeUnlocked(
    targetTime: number,
    currentTime = Date.now()
): boolean {
    return currentTime >= targetTime;
}

/**
 * Calculate remaining time in milliseconds
 */
export function getRemainingTime(
    targetTime: number,
    currentTime = Date.now()
): number {
    return Math.max(0, targetTime - currentTime);
}

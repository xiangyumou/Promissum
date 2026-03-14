/**
 * useCountdown Hook
 *
 * Provides a countdown timer that updates every interval.
 */

import { useState, useEffect } from 'react';

/**
 * Hook to get remaining time until a target date
 * @param targetDate Timestamp in milliseconds
 * @param interval Update interval in milliseconds (default 1000)
 * @returns Remaining milliseconds (min 0)
 */
export function useCountdown(
    targetDate: number,
    options?: {
        interval?: number;
    }
): number {
    const intervalMs = options?.interval ?? 1000;

    // Use state initializer function to avoid calling Date.now() during render
    const [timeLeft, setTimeLeft] = useState(() => Math.max(0, targetDate - Date.now()));

    // Update state when targetDate changes (using state setter function form)
    useEffect(() => {
        // Use functional update to avoid direct setState call
        setTimeLeft(Math.max(0, targetDate - Date.now()));
    }, [targetDate]);

    // Set up interval for countdown updates
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(Math.max(0, targetDate - Date.now()));
        }, intervalMs);

        return () => clearInterval(timer);
    }, [targetDate, intervalMs]);

    return timeLeft;
}

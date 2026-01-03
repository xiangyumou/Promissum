/**
 * useCountdown Hook
 *
 * Provides a countdown timer that updates every interval.
 * Uses timeService for testability.
 */

import { useState, useEffect, useMemo } from 'react';
import { timeService } from '@/lib/services/time-service';

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

    // Memoize initial value calculation
    const initialValue = useMemo(
        () => Math.max(0, targetDate - timeService.now()),
        [targetDate]
    );

    const [timeLeft, setTimeLeft] = useState(initialValue);

    // Update state when targetDate changes (using state setter function form)
    useEffect(() => {
        // Use functional update to avoid direct setState call
        setTimeLeft(Math.max(0, targetDate - timeService.now()));
    }, [targetDate]);

    // Set up interval for countdown updates
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(Math.max(0, targetDate - timeService.now()));
        }, intervalMs);

        return () => clearInterval(timer);
    }, [targetDate, intervalMs]);

    return timeLeft;
}

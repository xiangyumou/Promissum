/**
 * useCountdown Hook
 *
 * Provides a countdown timer that updates every interval.
 * Uses timeService for testability.
 */

import { useState, useEffect } from 'react';
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
    const [timeLeft, setTimeLeft] = useState(() => Math.max(0, targetDate - timeService.now()));

    useEffect(() => {
        // Initial update in case of SSR mismatch or delay
        setTimeLeft(Math.max(0, targetDate - timeService.now()));

        const timer = setInterval(() => {
            const diff = targetDate - timeService.now();
            setTimeLeft(Math.max(0, diff));
        }, intervalMs);

        return () => clearInterval(timer);
    }, [targetDate, intervalMs]);

    return timeLeft;
}

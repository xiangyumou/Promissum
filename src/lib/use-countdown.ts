/**
 * Custom hook for countdown timer using date-fns
 */

import { useState, useEffect } from 'react';
import { formatDuration, intervalToDuration } from 'date-fns';

export function useCountdown(decryptAt: number | null, unlocked: boolean) {
    const [countdown, setCountdown] = useState<string>('');

    useEffect(() => {
        if (!decryptAt || unlocked) {
            setCountdown('');
            return;
        }

        const updateCountdown = () => {
            const now = Date.now();
            const diff = decryptAt - now;

            if (diff <= 0) {
                setCountdown('');
                return;
            }

            // Use date-fns to calculate duration
            const duration = intervalToDuration({
                start: 0,
                end: diff
            });

            // Format duration with custom format
            const formatted = formatDuration(duration, {
                format: ['days', 'hours', 'minutes', 'seconds'],
                delimiter: ' ',
            }).replace(/(\d+) (\w+)/g, (match, num, unit) => {
                // Shorten units: days→d, hours→h, minutes→m, seconds→s
                const shortUnit = unit.charAt(0);
                return `${num}${shortUnit}`;
            });

            setCountdown(formatted || '0s');
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [decryptAt, unlocked]);

    return countdown;
}

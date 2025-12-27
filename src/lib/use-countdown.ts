/**
 * Custom hook for countdown timer
 */

import { useState, useEffect } from 'react';

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

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [decryptAt, unlocked]);

    return countdown;
}

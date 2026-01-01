'use client';

import { useSettings } from '@/lib/stores/settings-store';
import { useEffect, useRef } from 'react';

export default function SecurityProvider() {
    const {
        autoPrivacyDelayMinutes,
        privacyMode,
        setPrivacyMode
    } = useSettings();

    // Auto Privacy Logic
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (autoPrivacyDelayMinutes <= 0) return;
        if (privacyMode) return; // Already in privacy mode

        const timeoutMs = autoPrivacyDelayMinutes * 60 * 1000;

        const resetTimer = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setPrivacyMode(true);
            }, timeoutMs);
        };

        // Events to listen for activity
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        // Initial setup
        resetTimer();

        const handleActivity = () => {
            resetTimer();
        };

        // Attach listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Cleanup
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [autoPrivacyDelayMinutes, privacyMode, setPrivacyMode]);

    return null; // This component renders nothing
}

'use client';

import { useSettings } from '@/lib/stores/settings-store';
import { useEffect, useRef } from 'react';

export default function SecurityProvider() {
    const {
        autoPrivacyDelayMinutes,
        privacyMode,
        setPrivacyMode,
        panicShortcut,
        panicUrl
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
                // Determine if we should really switch to privacy mode
                // (double check state in case it changed)
                // Actually, inside timeout we should check refs or just set it.
                // Since this effect re-runs on autoPrivacyDelayMinutes change, it's fine.
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

    // Panic Shortcut Logic
    useEffect(() => {
        if (!panicShortcut || !panicUrl) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Parse shortcut string "alt+p" or "ctrl+shift+x"
            // Simple parser: split by '+', check modifiers and key
            const parts = panicShortcut.toLowerCase().split('+');
            const key = parts[parts.length - 1]; // last part is the key

            const modifiers = {
                alt: parts.includes('alt'),
                ctrl: parts.includes('ctrl') || parts.includes('control'),
                shift: parts.includes('shift'),
                meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command')
            };

            const isMatch =
                e.key.toLowerCase() === key &&
                e.altKey === modifiers.alt &&
                e.ctrlKey === modifiers.ctrl &&
                e.shiftKey === modifiers.shift &&
                e.metaKey === modifiers.meta;

            if (isMatch) {
                e.preventDefault();
                window.location.href = panicUrl;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [panicShortcut, panicUrl]);

    return null; // This component renders nothing
}

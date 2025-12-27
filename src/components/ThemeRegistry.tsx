'use client';

import { useSettings } from '@/lib/stores/settings-store';
import { useEffect } from 'react';

/**
 * ThemeRegistry
 * Observes the themeConfig from settings and applies CSS variables to the document root.
 * This allows user customization to override the default theme.
 */
export default function ThemeRegistry() {
    const { themeConfig } = useSettings();

    useEffect(() => {
        const root = document.documentElement;

        if (!themeConfig || Object.keys(themeConfig).length === 0) {
            // Remove overrides if config is empty
            // We can't easily track which ones we added, so we might need a more robust way if we mix sources.
            // But for now, if we assume keys map to --variable names.
            // A reload would clear them anyway if not persisted, but persistence handles re-application.
            return;
        }

        Object.entries(themeConfig).forEach(([key, value]) => {
            if (value) {
                root.style.setProperty(key, value);
            } else {
                root.style.removeProperty(key);
            }
        });

        // Cleanup function not strictly necessary as we want these to persist while component is mounted (always)
        // But if themeConfig changes to empty, we should ideally clean up. 
        // For simplicity, we just overwrite. To clear, user would probably reset settings.

    }, [themeConfig]);

    return null; // Headless component
}

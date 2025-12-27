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
        if (typeof window === 'undefined') return;

        const root = document.documentElement;

        // If themeConfig is empty, remove all custom properties to restore defaults
        if (Object.keys(themeConfig).length === 0) {
            // Remove any previously set custom properties
            const allVars = [
                '--primary', '--primary-contrast', '--secondary', '--accent',
                '--destructive', '--success', '--warning', '--info',
                '--bg', '--surface-1', '--surface-2', '--state-hover-bg',
                '--text', '--text-strong', '--muted',
                '--border', '--focus-ring', '--radius',
                '--glass-bg', '--glass-border', '--glass-shadow',
                '--sidebar-bg'
            ];

            allVars.forEach(varName => {
                root.style.removeProperty(varName);
            });
        } else {
            // Apply custom theme
            Object.entries(themeConfig).forEach(([key, value]) => {
                if (value) {
                    root.style.setProperty(key, value);
                }
            });
        }
    }, [themeConfig]);

    return null; // Headless component
}

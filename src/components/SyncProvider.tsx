'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sseClient } from '@/lib/sse-client';
import { migrateLocalStorage } from '@/lib/migrate-localstorage';
import { useSettings } from '@/lib/stores/settings-store';
import { getDeviceId } from '@/lib/device-id';

export function SyncProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const settings = useSettings();
    const isFirstMount = useRef(true);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    // 1. Initial Setup: Migration & SSE Connection
    useEffect(() => {
        migrateLocalStorage().catch(console.error);
        sseClient.connect(queryClient);
        return () => sseClient.disconnect();
    }, [queryClient]);

    // 2. Sync Settings Changes to API (Dual-Write)
    useEffect(() => {
        // Skip initial mount to prevent syncing defaults immediately
        // or syncing what we just loaded from localStorage
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        // Debounce API calls to avoid flooding
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            try {
                const deviceId = await getDeviceId();

                // Prepare payload (exclude actions/functions)
                const payload = {
                    deviceId,
                    defaultDurationMinutes: settings.defaultDurationMinutes,
                    privacyMode: settings.privacyMode,
                    panicUrl: settings.panicUrl,
                    themeConfig: JSON.stringify(settings.themeConfig || {}),
                    dateTimeFormat: settings.dateTimeFormat,
                    compactMode: settings.compactMode,
                    sidebarOpen: settings.sidebarOpen,
                    confirmDelete: settings.confirmDelete,
                    confirmExtend: settings.confirmExtend,
                    autoRefreshInterval: settings.autoRefreshInterval,
                    cacheTTLMinutes: settings.cacheTTLMinutes,
                    autoPrivacyDelayMinutes: settings.autoPrivacyDelayMinutes,
                    panicShortcut: settings.panicShortcut,
                    apiToken: settings.apiToken,
                    apiUrl: settings.apiUrl,
                };

                if (process.env.NODE_ENV === 'development') {
                    console.log('Syncing settings to cloud...', payload);
                }

                await fetch('/api/preferences', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } catch (error) {
                console.error('Failed to sync settings:', error);
            }
        }, 1000); // 1 second debounce

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [
        // Dependency array with specific fields to trigger sync
        settings.defaultDurationMinutes,
        settings.privacyMode,
        settings.panicUrl,
        settings.themeConfig,
        settings.dateTimeFormat,
        settings.compactMode,
        settings.sidebarOpen,
        settings.confirmDelete,
        settings.confirmExtend,
        settings.autoRefreshInterval,
        settings.cacheTTLMinutes,
        settings.autoPrivacyDelayMinutes,
        settings.panicShortcut,
        settings.apiToken,
        settings.apiUrl
    ]);

    return <>{children}</>;
}

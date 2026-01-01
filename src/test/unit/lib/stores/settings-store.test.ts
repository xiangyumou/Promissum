import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createSettingsStore, resetSettingsStore, useSettings } from '@/lib/stores/settings-store';

describe('settings-store', () => {
    beforeEach(() => {
        // Reset store and clear localStorage before each test
        vi.clearAllMocks();
        resetSettingsStore();
    });

    describe('Default Values', () => {
        it('should initialize with correct default values', () => {
            const state = useSettings.getState();

            expect(state.defaultDurationMinutes).toBe(60);
            expect(state.privacyMode).toBe(false);
            expect(state.themeConfig).toEqual({});
            expect(state.dateTimeFormat).toBe('yyyy-MM-dd HH:mm');
            expect(state.compactMode).toBe(false);
            expect(state.sidebarOpen).toBe(true);
            expect(state.confirmDelete).toBe(true);
            expect(state.confirmExtend).toBe(true);
            expect(state.autoRefreshInterval).toBe(60);
            expect(state.cacheTTLMinutes).toBe(5);
            expect(state.autoPrivacyDelayMinutes).toBe(5);
            expect(state.apiToken).toBe('');
            expect(state.apiUrl).toBe('');
        });
    });

    describe('Default Behavior Actions', () => {
        it('setDefaultDuration should update defaultDurationMinutes', () => {
            useSettings.getState().setDefaultDuration(120);
            expect(useSettings.getState().defaultDurationMinutes).toBe(120);
        });

        it('setDefaultDuration should handle edge values', () => {
            useSettings.getState().setDefaultDuration(1);
            expect(useSettings.getState().defaultDurationMinutes).toBe(1);

            useSettings.getState().setDefaultDuration(10080); // 1 week
            expect(useSettings.getState().defaultDurationMinutes).toBe(10080);
        });

        it('setPrivacyMode should toggle privacy mode', () => {
            expect(useSettings.getState().privacyMode).toBe(false);

            useSettings.getState().setPrivacyMode(true);
            expect(useSettings.getState().privacyMode).toBe(true);

            useSettings.getState().setPrivacyMode(false);
            expect(useSettings.getState().privacyMode).toBe(false);
        });
    });

    describe('Theme Configuration Actions', () => {
        it('setThemeConfig should update theme configuration', () => {
            const newConfig = { primary: '#ff0000', background: '#ffffff' };
            useSettings.getState().setThemeConfig(newConfig);
            expect(useSettings.getState().themeConfig).toEqual(newConfig);
        });

        it('setThemeConfig should replace entire config object', () => {
            useSettings.getState().setThemeConfig({ primary: '#ff0000' });
            useSettings.getState().setThemeConfig({ secondary: '#00ff00' });
            expect(useSettings.getState().themeConfig).toEqual({ secondary: '#00ff00' });
        });
    });

    describe('Interface Actions', () => {
        it('setDateTimeFormat should update format string', () => {
            useSettings.getState().setDateTimeFormat('dd/MM/yyyy HH:mm');
            expect(useSettings.getState().dateTimeFormat).toBe('dd/MM/yyyy HH:mm');
        });

        it('setCompactMode should toggle compact mode', () => {
            useSettings.getState().setCompactMode(true);
            expect(useSettings.getState().compactMode).toBe(true);
        });

        it('setSidebarOpen should toggle sidebar state', () => {
            useSettings.getState().setSidebarOpen(false);
            expect(useSettings.getState().sidebarOpen).toBe(false);

            useSettings.getState().setSidebarOpen(true);
            expect(useSettings.getState().sidebarOpen).toBe(true);
        });
    });

    describe('Behavior Actions', () => {
        it('setConfirmDelete should toggle delete confirmation', () => {
            useSettings.getState().setConfirmDelete(false);
            expect(useSettings.getState().confirmDelete).toBe(false);
        });

        it('setConfirmExtend should toggle extend confirmation', () => {
            useSettings.getState().setConfirmExtend(false);
            expect(useSettings.getState().confirmExtend).toBe(false);
        });

        it('setAutoRefreshInterval should update interval in seconds', () => {
            useSettings.getState().setAutoRefreshInterval(120);
            expect(useSettings.getState().autoRefreshInterval).toBe(120);
        });

        it('setAutoRefreshInterval should handle edge values', () => {
            useSettings.getState().setAutoRefreshInterval(0); // disabled
            expect(useSettings.getState().autoRefreshInterval).toBe(0);

            useSettings.getState().setAutoRefreshInterval(3600); // 1 hour
            expect(useSettings.getState().autoRefreshInterval).toBe(3600);
        });
    });

    describe('Caching Actions', () => {
        it('setCacheTTLMinutes should update cache TTL', () => {
            useSettings.getState().setCacheTTLMinutes(10);
            expect(useSettings.getState().cacheTTLMinutes).toBe(10);
        });

        it('setCacheTTLMinutes should handle boundary values', () => {
            useSettings.getState().setCacheTTLMinutes(0);
            expect(useSettings.getState().cacheTTLMinutes).toBe(0);

            useSettings.getState().setCacheTTLMinutes(999);
            expect(useSettings.getState().cacheTTLMinutes).toBe(999);
        });
    });

    describe('Security Actions', () => {
        it('setAutoPrivacyDelayMinutes should update delay', () => {
            useSettings.getState().setAutoPrivacyDelayMinutes(10);
            expect(useSettings.getState().autoPrivacyDelayMinutes).toBe(10);
        });

        it('setAutoPrivacyDelayMinutes should handle 0 (disabled)', () => {
            useSettings.getState().setAutoPrivacyDelayMinutes(0);
            expect(useSettings.getState().autoPrivacyDelayMinutes).toBe(0);
        });

        it('setApiToken should update API token', () => {
            useSettings.getState().setApiToken('my-secret-token');
            expect(useSettings.getState().apiToken).toBe('my-secret-token');
        });

        it('setApiUrl should update API URL', () => {
            useSettings.getState().setApiUrl('https://api.example.com');
            expect(useSettings.getState().apiUrl).toBe('https://api.example.com');
        });
    });

    describe('resetToDefaults', () => {
        it('should reset all values to defaults', () => {
            // Modify several settings
            useSettings.getState().setDefaultDuration(999);
            useSettings.getState().setPrivacyMode(true);
            useSettings.getState().setCacheTTLMinutes(100);
            useSettings.getState().setApiToken('token');

            // Reset
            useSettings.getState().resetToDefaults();

            // Verify all are back to defaults
            const state = useSettings.getState();
            expect(state.defaultDurationMinutes).toBe(60);
            expect(state.privacyMode).toBe(false);
            expect(state.cacheTTLMinutes).toBe(5);
            expect(state.apiToken).toBe('');
        });
    });

    describe('Store Access', () => {
        it('should support getState for direct access', () => {
            const state = useSettings.getState();
            expect(state.defaultDurationMinutes).toBe(60);

            useSettings.getState().setDefaultDuration(120);
            expect(useSettings.getState().defaultDurationMinutes).toBe(120);
        });

        it('should support subscribe for listening to changes', () => {
            const listener = vi.fn();
            const unsub = useSettings.subscribe(listener);

            useSettings.getState().setDefaultDuration(150);
            expect(listener).toHaveBeenCalled();

            unsub();
        });
    });
});



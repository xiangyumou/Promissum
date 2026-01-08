import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetSettingsStore, useSettings } from '@/lib/stores/settings-store';

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
            expect(state.dateTimeFormat).toBe('yyyy-MM-dd HH:mm');
            expect(state.sidebarOpen).toBe(true);
            expect(state.confirmDelete).toBe(true);
            expect(state.confirmExtend).toBe(true);
            expect(state.autoRefreshInterval).toBe(60);
            expect(state.cacheTTLMinutes).toBe(5);
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
    });

    describe('Interface Actions', () => {
        it('setDateTimeFormat should update format string', () => {
            useSettings.getState().setDateTimeFormat('dd/MM/yyyy HH:mm');
            expect(useSettings.getState().dateTimeFormat).toBe('dd/MM/yyyy HH:mm');
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

    describe('resetToDefaults', () => {
        it('should reset all values to defaults', () => {
            // Modify several settings
            useSettings.getState().setDefaultDuration(999);
            useSettings.getState().setCacheTTLMinutes(100);

            // Reset
            useSettings.getState().resetToDefaults();

            // Verify all are back to defaults
            const state = useSettings.getState();
            expect(state.defaultDurationMinutes).toBe(60);
            expect(state.cacheTTLMinutes).toBe(5);
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

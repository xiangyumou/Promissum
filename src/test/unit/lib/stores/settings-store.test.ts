import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettings, resetSettingsStore } from '@/lib/stores/settings-store';

// Mock env
vi.mock('@/lib/env', () => ({
    env: {
        dateFormat: 'yyyy-MM-dd HH:mm',
        autoRefreshInterval: 60,
        cacheTTLMinutes: 5,
    }
}));

describe('SettingsStore', () => {
    beforeEach(() => {
        resetSettingsStore();
    });

    it('should initialize with default values from env and hardcoded defaults', () => {
        const state = useSettings.getState();

        expect(state.sidebarOpen).toBe(true);
        expect(state.confirmDelete).toBe(true);
        expect(state.confirmExtend).toBe(true);
        expect(state.autoRefreshInterval).toBe(60);
        expect(state.cacheTTLMinutes).toBe(5);
        expect(state.enableUnlockSound).toBe(false);
        expect(state.enableUnlockConfetti).toBe(true);
    });

    it('should toggle sidebar', () => {
        useSettings.getState().setSidebarOpen(false);
        expect(useSettings.getState().sidebarOpen).toBe(false);

        useSettings.getState().setSidebarOpen(true);
        expect(useSettings.getState().sidebarOpen).toBe(true);
    });
});

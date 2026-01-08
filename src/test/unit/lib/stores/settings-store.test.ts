import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSettingsStore, resetSettingsStore } from '@/lib/stores/settings-store';


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
        const store = createSettingsStore();
        const state = store.getState();

        expect(state.sidebarOpen).toBe(true);
        expect(state.dateTimeFormat).toBe('yyyy-MM-dd HH:mm');
        expect(state.confirmDelete).toBe(true);
        expect(state.confirmExtend).toBe(true);
        expect(state.autoRefreshInterval).toBe(60);
        expect(state.cacheTTLMinutes).toBe(5);
        expect(state.enableUnlockSound).toBe(false);
        expect(state.enableUnlockConfetti).toBe(true);
    });

    it('should toggle sidebar', () => {
        const store = createSettingsStore();

        store.getState().setSidebarOpen(false);
        expect(store.getState().sidebarOpen).toBe(false);

        store.getState().setSidebarOpen(true);
        expect(store.getState().sidebarOpen).toBe(true);
    });

    it('should reset to defaults', () => {
        const store = createSettingsStore();

        store.getState().setSidebarOpen(false);
        expect(store.getState().sidebarOpen).toBe(false);

        store.getState().resetToDefaults();
        expect(store.getState().sidebarOpen).toBe(true);
    });

    // We no longer test setters for env-based values as they were removed
});

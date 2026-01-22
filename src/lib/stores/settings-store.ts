import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { env } from '@/lib/env';

/**
 * Settings State Interface
 */
interface SettingsState {
    // UI State
    sidebarOpen: boolean;

    // Behavior (from env vars or hardcoded)
    confirmDelete: boolean;
    confirmExtend: boolean;
    autoRefreshInterval: number; // seconds
    cacheTTLMinutes: number;

    // Unlock Effects
    enableUnlockSound: boolean;
    enableUnlockConfetti: boolean;

    // Actions
    setSidebarOpen: (open: boolean) => void;
}

/**
 * Settings Store
 *
 * Persists user preferences to localStorage.
 */
export const useSettings = create<SettingsState>()(
    persist(
        (set) => ({
            // UI State
            sidebarOpen: true,

            // Behavior
            confirmDelete: true,
            confirmExtend: true,
            autoRefreshInterval: env.autoRefreshInterval,
            cacheTTLMinutes: env.cacheTTLMinutes,

            // Unlock Effects
            enableUnlockSound: false,
            enableUnlockConfetti: true,

            // Actions
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
        }),
        {
            name: 'chaster-settings',
            partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
        }
    )
);

// Reset helper for tests
export function resetSettingsStore() {
    useSettings.setState({ sidebarOpen: true });
}

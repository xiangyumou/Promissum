import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { env } from '@/lib/env';

/**
 * Settings State Interface
 */
interface SettingsState {
    // Interface
    sidebarOpen: boolean;

    // Behavior (Read-only from Env or Hardcoded)
    readonly dateTimeFormat: string;
    readonly confirmDelete: boolean;
    readonly confirmExtend: boolean;
    readonly autoRefreshInterval: number; // seconds
    readonly cacheTTLMinutes: number;

    // Unlock Effects (Still configurable by user logic? Or should this be removed too?
    // User request: "Settings page not needed". Keeping these might be confusing if there's no UI to change them.
    // However, user didn't explicitly ask to remove unlock effects *logic*, just the page.
    // I will keep them as internal state or remove if they were purely UI settings.
    // The prompt says "Settings page not needed, main page settings button not needed".
    // This implies inability to change these. I will hardcode defaults or remove them.
    // I'll keep them as simple state if needed, but for now I'll assume they default to their values and are not changeable.
    // Actually, let's keep them as state but with no setters exposed in the interface if we strictly follow "settings page gone".
    // But if we can't change them, why keep them in store?
    // Let's simplified to just returning the values.
    readonly enableUnlockSound: boolean;
    readonly enableUnlockConfetti: boolean;

    // Actions
    setSidebarOpen: (open: boolean) => void;
    // No other setters needed as settings page is gone.

    // Test helper
    resetToDefaults: () => void;
}

/**
 * Settings Store
 * 
 * Persists user preferences to localStorage.
 * Now mostly read-only for env vars, but keeps sidebar state.
 */

import { StoreApi, UseBoundStore } from 'zustand';

type SettingsStore = UseBoundStore<StoreApi<SettingsState>>;

export const createSettingsStore = (
    initialState: Partial<SettingsState> = {}
): SettingsStore => {
    return create<SettingsState>()(
        persist(
            (set) => ({
                // Persistent State
                sidebarOpen: true,

                // Read-only / Environment Driven
                dateTimeFormat: env.dateFormat,
                confirmDelete: true, // "Operation confirmation default want" -> always true
                confirmExtend: true, // "Operation confirmation default want" -> always true
                autoRefreshInterval: env.autoRefreshInterval,
                cacheTTLMinutes: env.cacheTTLMinutes,

                // Defaults for effects (hardcoded as we have no UI to change them anymore)
                enableUnlockSound: false,
                enableUnlockConfetti: true,

                ...initialState,

                // Actions
                setSidebarOpen: (open) => set({ sidebarOpen: open }),

                resetToDefaults: () => set({ sidebarOpen: true }),
            }),
            {
                name: 'chaster-settings',
                partialize: (state) => ({ sidebarOpen: state.sidebarOpen }), // Only persist sidebar state
            }
        )
    );
};

// Default singleton store
export const useSettings = createSettingsStore();

// Reset helper for tests
export function resetSettingsStore() {
    useSettings.setState({ sidebarOpen: true });
}

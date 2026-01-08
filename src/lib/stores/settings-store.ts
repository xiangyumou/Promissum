import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Settings State Interface
 */
interface SettingsState {
    // Default Behavior
    defaultDurationMinutes: number;

    // Interface
    dateTimeFormat: string;
    sidebarOpen: boolean;

    // Behavior
    confirmDelete: boolean;
    confirmExtend: boolean;
    autoRefreshInterval: number; // seconds

    // Caching
    cacheTTLMinutes: number;

    // Unlock Effects
    enableUnlockSound: boolean;
    enableUnlockConfetti: boolean;

    // Actions
    setDefaultDuration: (minutes: number) => void;

    setDateTimeFormat: (format: string) => void;
    setSidebarOpen: (open: boolean) => void;

    setConfirmDelete: (enabled: boolean) => void;
    setConfirmExtend: (enabled: boolean) => void;
    setAutoRefreshInterval: (seconds: number) => void;

    setCacheTTLMinutes: (minutes: number) => void;

    setEnableUnlockSound: (enabled: boolean) => void;
    setEnableUnlockConfetti: (enabled: boolean) => void;

    resetToDefaults: () => void;
}

/**
 * Default Settings Values
 */
const DEFAULT_SETTINGS: Omit<SettingsState,
    'setDefaultDuration' |
    'setDateTimeFormat' | 'setSidebarOpen' |
    'setConfirmDelete' | 'setConfirmExtend' | 'setAutoRefreshInterval' |
    'setCacheTTLMinutes' |
    'setEnableUnlockSound' | 'setEnableUnlockConfetti' |
    'resetToDefaults'
> = {
    defaultDurationMinutes: 60,

    dateTimeFormat: 'yyyy-MM-dd HH:mm',
    sidebarOpen: true,

    confirmDelete: true,
    confirmExtend: true,
    autoRefreshInterval: 60,

    cacheTTLMinutes: 5,

    enableUnlockSound: false,
    enableUnlockConfetti: true,
};

/**
 * Settings Store
 * 
 * Persists user preferences to localStorage.
 * Uses a factory pattern to allow for test isolation.
 */

import { StoreApi, UseBoundStore } from 'zustand';

type SettingsStore = UseBoundStore<StoreApi<SettingsState>>;

export const createSettingsStore = (
    initialState: Partial<SettingsState> = {}
): SettingsStore => {
    return create<SettingsState>()(
        persist(
            (set) => ({
                // Default values
                ...DEFAULT_SETTINGS,
                ...initialState,

                // Actions
                setDefaultDuration: (minutes) => set({ defaultDurationMinutes: minutes }),

                // Interface
                setDateTimeFormat: (format) => set({ dateTimeFormat: format }),
                setSidebarOpen: (open) => set({ sidebarOpen: open }),

                // Behavior
                setConfirmDelete: (enabled) => set({ confirmDelete: enabled }),
                setConfirmExtend: (enabled) => set({ confirmExtend: enabled }),
                setAutoRefreshInterval: (seconds) => set({ autoRefreshInterval: seconds }),

                // Caching
                setCacheTTLMinutes: (minutes) => set({ cacheTTLMinutes: minutes }),

                // Unlock Effects
                setEnableUnlockSound: (enabled) => set({ enableUnlockSound: enabled }),
                setEnableUnlockConfetti: (enabled) => set({ enableUnlockConfetti: enabled }),

                resetToDefaults: () => set(DEFAULT_SETTINGS),
            }),
            {
                name: 'chaster-settings',
            }
        )
    );
};

// Default singleton store
export const useSettings = createSettingsStore();

// Reset helper for tests
export function resetSettingsStore() {
    useSettings.setState(DEFAULT_SETTINGS);
}

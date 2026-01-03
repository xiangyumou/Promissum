import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Settings State Interface
 */
interface SettingsState {
    // Default Behavior
    defaultDurationMinutes: number;
    privacyMode: boolean;

    // Theme Configuration
    themeConfig: Record<string, string>;

    // Interface
    dateTimeFormat: string;
    compactMode: boolean;
    sidebarOpen: boolean;

    // Behavior
    confirmDelete: boolean;
    confirmExtend: boolean;
    autoRefreshInterval: number; // seconds

    // Caching
    cacheTTLMinutes: number;

    // Security
    autoPrivacyDelayMinutes: number; // 0 = disabled
    apiToken: string; // Custom API token overrides env
    apiUrl: string; // Custom API URL overrides env

    // Unlock Effects
    enableUnlockSound: boolean;
    enableUnlockConfetti: boolean;

    // Actions
    setDefaultDuration: (minutes: number) => void;
    setPrivacyMode: (enabled: boolean) => void;
    setThemeConfig: (config: Record<string, string>) => void;

    setDateTimeFormat: (format: string) => void;
    setCompactMode: (enabled: boolean) => void;
    setSidebarOpen: (open: boolean) => void;

    setConfirmDelete: (enabled: boolean) => void;
    setConfirmExtend: (enabled: boolean) => void;
    setAutoRefreshInterval: (seconds: number) => void;

    setCacheTTLMinutes: (minutes: number) => void;

    setAutoPrivacyDelayMinutes: (minutes: number) => void;
    setApiToken: (token: string) => void;
    setApiUrl: (url: string) => void;

    setEnableUnlockSound: (enabled: boolean) => void;
    setEnableUnlockConfetti: (enabled: boolean) => void;

    resetToDefaults: () => void;
}

/**
 * Default Settings Values
 */
const DEFAULT_SETTINGS: Omit<SettingsState,
    'setDefaultDuration' | 'setPrivacyMode' | 'setThemeConfig' |
    'setDateTimeFormat' | 'setCompactMode' | 'setSidebarOpen' |
    'setConfirmDelete' | 'setConfirmExtend' | 'setAutoRefreshInterval' |
    'setCacheTTLMinutes' | 'setAutoPrivacyDelayMinutes' |
    'setApiToken' | 'setApiUrl' |
    'setEnableUnlockSound' | 'setEnableUnlockConfetti' |
    'resetToDefaults'
> = {
    defaultDurationMinutes: 60,
    privacyMode: false,
    themeConfig: {},

    dateTimeFormat: 'yyyy-MM-dd HH:mm',
    compactMode: false,
    sidebarOpen: true,

    confirmDelete: true,
    confirmExtend: true,
    autoRefreshInterval: 60,

    cacheTTLMinutes: 5,

    autoPrivacyDelayMinutes: 5,
    apiToken: '',
    apiUrl: '',

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
                setPrivacyMode: (enabled) => set({ privacyMode: enabled }),
                setThemeConfig: (config) => set({ themeConfig: config }),

                // Interface
                setDateTimeFormat: (format) => set({ dateTimeFormat: format }),
                setCompactMode: (enabled) => set({ compactMode: enabled }),
                setSidebarOpen: (open) => set({ sidebarOpen: open }),

                // Behavior
                setConfirmDelete: (enabled) => set({ confirmDelete: enabled }),
                setConfirmExtend: (enabled) => set({ confirmExtend: enabled }),
                setAutoRefreshInterval: (seconds) => set({ autoRefreshInterval: seconds }),

                // Caching
                setCacheTTLMinutes: (minutes) => set({ cacheTTLMinutes: minutes }),

                // Security
                setAutoPrivacyDelayMinutes: (minutes) => set({ autoPrivacyDelayMinutes: minutes }),
                setApiToken: (token) => set({ apiToken: token }),
                setApiUrl: (url) => set({ apiUrl: url }),

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

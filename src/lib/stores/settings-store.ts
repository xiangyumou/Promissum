import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FilterParams } from '../types';

/**
 * Settings State Interface
 */
interface SettingsState {
    // Default Behavior
    defaultDurationMinutes: number;
    privacyMode: boolean;
    panicUrl: string;

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
    panicShortcut: string;
    apiToken: string; // Custom API token overrides env
    apiUrl: string; // Custom API URL overrides env

    // Actions
    setDefaultDuration: (minutes: number) => void;
    setPrivacyMode: (enabled: boolean) => void;
    setPanicUrl: (url: string) => void;
    setThemeConfig: (config: Record<string, string>) => void;

    // New Actions
    setDateTimeFormat: (format: string) => void;
    setCompactMode: (enabled: boolean) => void;
    setSidebarOpen: (open: boolean) => void;

    setConfirmDelete: (enabled: boolean) => void;
    setConfirmExtend: (enabled: boolean) => void;
    setAutoRefreshInterval: (seconds: number) => void;

    setCacheTTLMinutes: (minutes: number) => void;

    setAutoPrivacyDelayMinutes: (minutes: number) => void;
    setPanicShortcut: (shortcut: string) => void;
    setApiToken: (token: string) => void;
    setApiUrl: (url: string) => void;

    resetToDefaults: () => void;
}

/**
 * Default Settings Values
 */
const DEFAULT_SETTINGS: Omit<SettingsState, 'setDefaultDuration' | 'setPrivacyMode' | 'setPanicUrl' | 'setThemeConfig' | 'setDateTimeFormat' | 'setCompactMode' | 'setSidebarOpen' | 'setConfirmDelete' | 'setConfirmExtend' | 'setAutoRefreshInterval' | 'setDefaultSort' | 'setCacheTTLMinutes' | 'setAutoPrivacyDelayMinutes' | 'setPanicShortcut' | 'setApiToken' | 'setApiUrl' | 'resetToDefaults'> = {
    defaultDurationMinutes: 60,
    privacyMode: false,
    panicUrl: 'https://google.com',
    themeConfig: {},

    // New Defaults
    dateTimeFormat: 'yyyy-MM-dd HH:mm',
    compactMode: false,
    sidebarOpen: true,

    confirmDelete: true,
    confirmExtend: true,
    autoRefreshInterval: 60,

    cacheTTLMinutes: 5,

    autoPrivacyDelayMinutes: 5,
    panicShortcut: 'alt+p',
    apiToken: '',
    apiUrl: '',
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
                ...(DEFAULT_SETTINGS as any),
                ...initialState,

                // Actions
                setDefaultDuration: (minutes) => set({ defaultDurationMinutes: minutes }),
                setPrivacyMode: (enabled) => set({ privacyMode: enabled }),
                setPanicUrl: (url) => set({ panicUrl: url }),
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
                setPanicShortcut: (shortcut) => set({ panicShortcut: shortcut }),
                setApiToken: (token) => set({ apiToken: token }),
                setApiUrl: (url) => set({ apiUrl: url }),

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
    useSettings.setState(DEFAULT_SETTINGS as any);
}

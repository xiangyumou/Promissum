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

    // Interface
    dateTimeFormat: string;
    compactMode: boolean;
    sidebarOpen: boolean;

    // Behavior
    confirmDelete: boolean;
    confirmExtend: boolean;
    autoRefreshInterval: number; // seconds
    defaultSort: FilterParams['sort'];

    // Caching
    cacheTTLMinutes: number;

    // Security
    autoPrivacyDelayMinutes: number; // 0 = disabled
    panicShortcut: string;

    // Actions
    setDefaultDuration: (minutes: number) => void;
    setPrivacyMode: (enabled: boolean) => void;
    setPanicUrl: (url: string) => void;

    // New Actions
    setDateTimeFormat: (format: string) => void;
    setCompactMode: (enabled: boolean) => void;
    setSidebarOpen: (open: boolean) => void;

    setConfirmDelete: (enabled: boolean) => void;
    setConfirmExtend: (enabled: boolean) => void;
    setAutoRefreshInterval: (seconds: number) => void;
    setDefaultSort: (sort: FilterParams['sort']) => void;

    setCacheTTLMinutes: (minutes: number) => void;

    setAutoPrivacyDelayMinutes: (minutes: number) => void;
    setPanicShortcut: (shortcut: string) => void;

    resetToDefaults: () => void;
}

/**
 * Default Settings Values
 */
const DEFAULT_SETTINGS: Omit<SettingsState, 'setDefaultDuration' | 'setPrivacyMode' | 'setPanicUrl' | 'setDateTimeFormat' | 'setCompactMode' | 'setSidebarOpen' | 'setConfirmDelete' | 'setConfirmExtend' | 'setAutoRefreshInterval' | 'setDefaultSort' | 'setCacheTTLMinutes' | 'setAutoPrivacyDelayMinutes' | 'setPanicShortcut' | 'resetToDefaults'> = {
    defaultDurationMinutes: 60,
    privacyMode: false,
    panicUrl: 'https://google.com',

    // New Defaults
    dateTimeFormat: 'yyyy-MM-dd HH:mm',
    compactMode: false,
    sidebarOpen: true,

    confirmDelete: true,
    confirmExtend: true,
    autoRefreshInterval: 60,
    defaultSort: 'created_desc',

    cacheTTLMinutes: 5,

    autoPrivacyDelayMinutes: 5,
    panicShortcut: 'alt+p',
};

/**
 * Settings Store
 * Persists user preferences to localStorage
 */
export const useSettings = create<SettingsState>()(
    persist(
        (set) => ({
            // Default values
            ...(DEFAULT_SETTINGS as any), // Cast to avoid complex type matching implementation details

            // Actions
            setDefaultDuration: (minutes) => set({ defaultDurationMinutes: minutes }),
            setPrivacyMode: (enabled) => set({ privacyMode: enabled }),
            setPanicUrl: (url) => set({ panicUrl: url }),

            // Interface
            setDateTimeFormat: (format) => set({ dateTimeFormat: format }),
            setCompactMode: (enabled) => set({ compactMode: enabled }),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),

            // Behavior
            setConfirmDelete: (enabled) => set({ confirmDelete: enabled }),
            setConfirmExtend: (enabled) => set({ confirmExtend: enabled }),
            setAutoRefreshInterval: (seconds) => set({ autoRefreshInterval: seconds }),
            setDefaultSort: (sort) => set({ defaultSort: sort }),

            // Caching
            setCacheTTLMinutes: (minutes) => set({ cacheTTLMinutes: minutes }),

            // Security
            setAutoPrivacyDelayMinutes: (minutes) => set({ autoPrivacyDelayMinutes: minutes }),
            setPanicShortcut: (shortcut) => set({ panicShortcut: shortcut }),

            resetToDefaults: () => set(DEFAULT_SETTINGS),
        }),
        {
            name: 'chaster-settings',
        }
    )
);

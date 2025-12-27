import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Settings State Interface
 */
interface SettingsState {
    // Default Behavior
    defaultDurationMinutes: number;
    privacyMode: boolean;

    panicUrl: string;

    // Actions
    setDefaultDuration: (minutes: number) => void;
    setPrivacyMode: (enabled: boolean) => void;

    setPanicUrl: (url: string) => void;
    resetToDefaults: () => void;
}

/**
 * Default Settings Values
 */
const DEFAULT_SETTINGS = {
    defaultDurationMinutes: 60,
    privacyMode: false,

    panicUrl: 'https://google.com',
};

/**
 * Settings Store
 * Persists user preferences to localStorage
 */
export const useSettings = create<SettingsState>()(
    persist(
        (set) => ({
            // Default values
            ...DEFAULT_SETTINGS,
            privacyMode: false,


            // Actions
            setDefaultDuration: (minutes) => set({ defaultDurationMinutes: minutes }),
            setPrivacyMode: (enabled) => set({ privacyMode: enabled }),

            setPanicUrl: (url) => set({ panicUrl: url }),

            resetToDefaults: () => set(DEFAULT_SETTINGS),
        }),
        {
            name: 'chaster-settings',
        }
    )
);

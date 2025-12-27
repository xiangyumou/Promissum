import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Settings State Interface
 */
interface SettingsState {
    // Default Behavior
    defaultDurationMinutes: number;

    // Actions
    setDefaultDuration: (minutes: number) => void;
    resetToDefaults: () => void;
}

/**
 * Default Settings Values
 */
const DEFAULT_SETTINGS = {
    defaultDurationMinutes: 60,
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

            // Actions
            setDefaultDuration: (minutes) => set({ defaultDurationMinutes: minutes }),

            resetToDefaults: () => set(DEFAULT_SETTINGS),
        }),
        {
            name: 'chaster-settings',
        }
    )
);

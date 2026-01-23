import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { env } from '@/lib/env';
import { STORAGE_KEYS } from '@/lib/constants';

function migrateFromLegacyStorage(): void {
    if (typeof window === 'undefined') return;

    const legacyData = localStorage.getItem(STORAGE_KEYS.LEGACY_SETTINGS);
    const newData = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    if (legacyData && !newData) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, legacyData);
        localStorage.removeItem(STORAGE_KEYS.LEGACY_SETTINGS);
    }
}

if (typeof window !== 'undefined') {
    migrateFromLegacyStorage();
}

interface SettingsState {
    sidebarOpen: boolean;
    confirmDelete: boolean;
    confirmExtend: boolean;
    autoRefreshInterval: number;
    cacheTTLMinutes: number;
    enableUnlockSound: boolean;
    enableUnlockConfetti: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export const useSettings = create<SettingsState>()(
    persist(
        (set) => ({
            sidebarOpen: true,
            confirmDelete: true,
            confirmExtend: true,
            autoRefreshInterval: env.autoRefreshInterval,
            cacheTTLMinutes: env.cacheTTLMinutes,
            enableUnlockSound: false,
            enableUnlockConfetti: true,
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
        }),
        {
            name: STORAGE_KEYS.SETTINGS,
            partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
        }
    )
);

export function resetSettingsStore() {
    useSettings.setState({ sidebarOpen: true });
}

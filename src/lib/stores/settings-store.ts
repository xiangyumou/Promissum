import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/constants';

interface SettingsState {
    sidebarOpen: boolean;
    confirmDelete: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export const useSettings = create<SettingsState>()(
    persist(
        (set) => ({
            sidebarOpen: true,
            confirmDelete: true,
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
        }),
        {
            name: STORAGE_KEYS.SETTINGS,
        }
    )
);

export function resetSettingsStore() {
    useSettings.setState({ sidebarOpen: true });
}

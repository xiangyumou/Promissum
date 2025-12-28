/**
 * localStorage to Database Migration
 * 
 * One-time migration that uploads existing localStorage settings to the database.
 * Runs on first visit after implementing multi-device sync.
 */

import { getDeviceId } from './device-id';

const MIGRATION_FLAG_KEY = 'promissum_settings_migrated';
const SETTINGS_KEY = 'chaster-settings';

interface LocalStorageSettings {
    state: {
        defaultDurationMinutes?: number;
        privacyMode?: boolean;
        panicUrl?: string;
        themeConfig?: Record<string, string>;
        dateTimeFormat?: string;
        compactMode?: boolean;
        sidebarOpen?: boolean;
        confirmDelete?: boolean;
        confirmExtend?: boolean;
        autoRefreshInterval?: number;
        cacheTTLMinutes?: number;
        autoPrivacyDelayMinutes?: number;
        panicShortcut?: string;
        apiToken?: string;
        apiUrl?: string;
    };
}

/**
 * Check if migration has already been performed
 */
export function isMigrationComplete(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
}

/**
 * Migrate localStorage settings to database
 */
export async function migrateLocalStorage(): Promise<boolean> {
    if (typeof window === 'undefined') {
        console.warn('Cannot migrate localStorage on server');
        return false;
    }

    // Skip if already migrated
    if (isMigrationComplete()) {
        console.log('Settings migration already completed');
        return true;
    }

    try {
        // Get existing settings from localStorage
        const settingsJson = localStorage.getItem(SETTINGS_KEY);
        if (!settingsJson) {
            console.log('No existing settings to migrate');
            localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
            return true;
        }

        const settings: LocalStorageSettings = JSON.parse(settingsJson);
        const deviceId = await getDeviceId();

        // Upload to database
        const response = await fetch('/api/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                deviceId,
                ...settings.state,
                themeConfig: JSON.stringify(settings.state.themeConfig || {}),
            }),
        });

        if (!response.ok) {
            throw new Error(`Migration API call failed: ${response.statusText}`);
        }

        // Mark migration as complete
        localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
        console.log('Successfully migrated settings to database');
        return true;
    } catch (error) {
        console.error('Failed to migrate localStorage settings:', error);
        return false;
    }
}

/**
 * Reset migration flag (for testing)
 */
export function resetMigration(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(MIGRATION_FLAG_KEY);
    }
}

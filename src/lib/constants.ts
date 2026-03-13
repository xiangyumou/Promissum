/**
 * Application Constants
 */

// Time Constants (Milliseconds)
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

// Time Constants (Minutes)
export const MINUTES_PER_HOUR = 60;
export const MINUTES_PER_DAY = 1440;

// Polling Intervals
export const POLLING_INTERVAL_MS = 10000; // 10 seconds

// API & Pagination
export const MAX_ITEMS_PER_PAGE = 1000;
export const DEFAULT_ITEMS_PER_PAGE = 50;
export const MAX_API_RETRIES = 3;

// UI Constants
export const TOAST_DURATION_MS = 3000;
export const CONFIRMATION_TIMEOUT_MS = 3000;
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
export const COUNTDOWN_INTERVAL_MS = 1000;

// Duration Presets for AddModal
export const DURATION_PRESETS = [
    { label: '1m', minutes: 1 },
    { label: '10m', minutes: 10 },
    { label: '1h', minutes: 60 },
    { label: '6h', minutes: 360 },
    { label: '1d', minutes: 1440 },
] as const;

// Storage Keys
export const STORAGE_KEYS = {
    SETTINGS: 'promissum-settings',
} as const;

// Application Metadata
export const APP_NAME = 'Promissum';
export const APP_TITLE = 'Promissum - Timelock Encryption';

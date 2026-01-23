/**
 * Application Constants
 *
 * Centralized configuration for magic numbers and application-wide constants.
 * Import from here instead of using raw numeric literals.
 */

// ============================================
// Time Constants (Milliseconds)
// ============================================
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

// ============================================
// Time Constants (Minutes)
// ============================================
export const MINUTES_PER_HOUR = 60;
export const MINUTES_PER_DAY = 1440;

// ============================================
// Polling Intervals
// ============================================
export const POLLING_INTERVAL = {
    /** Initial polling interval when data is not yet loaded */
    INITIAL_MS: 1000,
    /** Fast polling when unlock is imminent (within 1 minute) */
    FAST_MS: 5000,
    /** Default polling interval for locked items */
    DEFAULT_MS: 60000,
    /** Health check polling interval */
    HEALTH_CHECK_MS: 30000,
} as const;

/** Threshold for switching to fast polling (1 minute before unlock) */
export const NEAR_UNLOCK_THRESHOLD_MS = 60000;

// ============================================
// API & Pagination
// ============================================
export const MAX_ITEMS_PER_PAGE = 1000;
export const DEFAULT_ITEMS_PER_PAGE = 50;
export const MAX_API_RETRIES = 3;

/** Default lock duration in minutes (12 hours) */
export const DEFAULT_LOCK_DURATION_MINUTES = 720;

// ============================================
// Rate Limiting Defaults
// ============================================
export const DEFAULT_RATE_LIMIT = {
    /** Maximum requests per window */
    MAX_REQUESTS: 100,
    /** Time window in milliseconds (1 minute) */
    WINDOW_MS: 60000,
} as const;

/** Maximum delay between Redis reconnection attempts */
export const REDIS_MAX_RETRY_DELAY_MS = 3000;

// ============================================
// UI Constants
// ============================================
/** Default toast notification duration */
export const TOAST_DURATION_MS = 3000;

/** Timeout for confirmation dialogs (e.g., delete confirmation) */
export const CONFIRMATION_TIMEOUT_MS = 3000;

/** Maximum file upload size (5MB) */
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

/** Spring animation configuration for sidebar/modals */
export const SPRING_CONFIG = {
    STIFFNESS: 300,
    DAMPING: 30,
} as const;

/** Countdown update interval */
export const COUNTDOWN_INTERVAL_MS = 1000;

// ============================================
// Duration Presets for AddModal
// ============================================
export const DURATION_PRESETS = [
    { label: '1m', minutes: 1 },
    { label: '10m', minutes: 10 },
    { label: '1h', minutes: 60 },
    { label: '6h', minutes: 360 },
    { label: '1d', minutes: 1440 },
] as const;

// ============================================
// Storage Keys
// ============================================
export const STORAGE_KEYS = {
    SETTINGS: 'promissum-settings',
    LEGACY_SETTINGS: 'chaster-settings',
} as const;

// ============================================
// Application Metadata
// ============================================
export const APP_NAME = 'Promissum';
export const APP_TITLE = 'Promissum - Timelock Encryption';

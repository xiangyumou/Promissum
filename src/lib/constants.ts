/**
 * Application Constants
 */

// Time Constants (Milliseconds)
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

// File Size Limits
export const MAX_TOTAL_SIZE_BYTES = 10 * 1024 * 1024; // 10MB total
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per file

// Duration Presets for AddModal
export const DURATION_PRESETS = [
    { label: '1分钟', minutes: 1 },
    { label: '10分钟', minutes: 10 },
    { label: '1小时', minutes: 60 },
    { label: '6小时', minutes: 360 },
    { label: '1天', minutes: 1440 },
] as const;

// Application Metadata
export const APP_NAME = 'Promissum';
export const APP_TITLE = 'Promissum - 时间锁加密';

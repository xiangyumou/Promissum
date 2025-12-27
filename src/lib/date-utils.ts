/**
 * Date Formatting Utilities
 * 
 * Centralized date formatting using date-fns for consistency across the app.
 * Supports i18n with locale-aware formatting.
 */

import { format, formatDistanceToNow, formatRelative, isValid, Locale } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

// Locale mapping
const locales: Record<string, Locale> = {
    zh: zhCN,
    en: enUS,
};

/**
 * Get date-fns locale based on locale string
 */
export function getDateLocale(locale: string = 'en'): Locale {
    return locales[locale] || enUS;
}

/**
 * Format a date using the specified format pattern
 * 
 * @param date - Date to format (number timestamp, Date object, or string)
 * @param formatPattern - date-fns format pattern
 * @param locale - Locale string ('zh' or 'en')
 * @returns Formatted date string
 */
export function formatDate(
    date: number | Date | string,
    formatPattern: string = 'yyyy-MM-dd HH:mm',
    locale: string = 'en'
): string {
    const dateObj = typeof date === 'number' ? new Date(date)
        : typeof date === 'string' ? new Date(date)
            : date;

    if (!isValid(dateObj)) {
        return 'Invalid date';
    }

    return format(dateObj, formatPattern, { locale: getDateLocale(locale) });
}

/**
 * Format a date for display in the UI (locale-aware)
 * 
 * @param date - Date to format
 * @param locale - Locale string
 * @returns Localized date-time string
 */
export function formatDateTime(date: number | Date | string, locale: string = 'en'): string {
    return formatDate(date, 'PPpp', locale);
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 * 
 * @param date - Date to format
 * @param locale - Locale string
 * @returns Relative time string
 */
export function formatTimeAgo(date: number | Date | string, locale: string = 'en'): string {
    const dateObj = typeof date === 'number' ? new Date(date)
        : typeof date === 'string' ? new Date(date)
            : date;

    if (!isValid(dateObj)) {
        return 'Invalid date';
    }

    return formatDistanceToNow(dateObj, {
        addSuffix: true,
        locale: getDateLocale(locale)
    });
}

/**
 * Format a date relative to now (e.g., "yesterday at 5:00 PM")
 * 
 * @param date - Date to format
 * @param locale - Locale string
 * @returns Relative date string
 */
export function formatRelativeDate(date: number | Date | string, locale: string = 'en'): string {
    const dateObj = typeof date === 'number' ? new Date(date)
        : typeof date === 'string' ? new Date(date)
            : date;

    if (!isValid(dateObj)) {
        return 'Invalid date';
    }

    return formatRelative(dateObj, new Date(), { locale: getDateLocale(locale) });
}

/**
 * Format a date for short display (e.g., "Dec 28, 14:30")
 * 
 * @param date - Date to format
 * @param locale - Locale string
 * @returns Short formatted date
 */
export function formatShortDate(date: number | Date | string, locale: string = 'en'): string {
    return formatDate(date, 'MMM d, HH:mm', locale);
}

/**
 * Format a countdown target date
 * 
 * @param date - Target date
 * @param locale - Locale string
 * @returns Formatted target date
 */
export function formatUnlockTime(date: number | Date | string, locale: string = 'en'): string {
    return formatDate(date, 'Pp', locale);
}

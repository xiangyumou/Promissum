/**
 * Date Formatting Utilities
 *
 * Centralized date formatting using date-fns for consistency across the app.
 * Supports i18n with locale-aware formatting.
 */

import { format, isValid, Locale } from 'date-fns';
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
 * Format a countdown target date
 *
 * @param date - Target date
 * @param locale - Locale string
 * @returns Formatted target date
 */
export function formatUnlockTime(date: number | Date | string, locale: string = 'en'): string {
    return formatDate(date, 'Pp', locale);
}

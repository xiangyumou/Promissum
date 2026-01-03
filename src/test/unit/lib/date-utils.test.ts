import { describe, it, expect } from 'vitest';
import {
    getDateLocale,
    formatDate,
    formatDateTime,
    formatTimeAgo,
    formatRelativeDate,
    formatShortDate,
    formatUnlockTime
} from '@/lib/date-utils';
import { enUS, zhCN } from 'date-fns/locale';

describe('date-utils', () => {
    const TEST_DATE = new Date('2023-12-25T10:30:00.000Z');
    const TIMESTAMP = TEST_DATE.getTime();

    describe('getDateLocale', () => {
        it('should return enUS for en locale', () => {
            expect(getDateLocale('en')).toBe(enUS);
        });

        it('should return zhCN for zh locale', () => {
            expect(getDateLocale('zh')).toBe(zhCN);
        });

        it('should fall back to enUS for unknown locale', () => {
            expect(getDateLocale('fr')).toBe(enUS);
        });

        it('should fall back to enUS for undefined locale', () => {
            expect(getDateLocale(undefined)).toBe(enUS);
        });
    });

    describe('formatDate', () => {
        it('should format date correctly with default pattern', () => {
            // Note: Output depends on local time zone of the runner environment
            // Using a pattern that is less timezone sensitive or mocking timezone would be ideal
            // For now, we check it returns a string
            const result = formatDate(TEST_DATE);
            expect(typeof result).toBe('string');
            expect(result).toContain('2023-12-25');
        });

        it('should format timestamp correctly', () => {
            const result = formatDate(TIMESTAMP, 'yyyy-MM-dd');
            expect(result).toBe('2023-12-25');
        });

        it('should format string date correctly', () => {
            const result = formatDate('2023-12-25T10:30:00.000Z', 'yyyy-MM-dd');
            expect(result).toBe('2023-12-25');
        });

        it('should handle invalid date', () => {
            expect(formatDate('invalid-date')).toBe('Invalid date');
        });

        it('should handle edge cases', () => {
            const leapYearDate = new Date('2024-02-29T12:00:00');
            const formatted = formatDate(leapYearDate);
            expect(formatted).toContain('2024-02-29'); // Check for date presence

            const endOfYear = new Date('2023-12-31T23:59:59');
            expect(formatDateTime(endOfYear)).toContain('2023');

            // Edge case: Time ago for exactly now/very recent
            expect(formatTimeAgo(new Date())).toBe('less than a minute ago');
        });

        it('should return safe defaults for invalid inputs', () => {
            expect(formatDate(null as unknown as Date)).toBe('Invalid date');
            expect(formatDate(undefined as unknown as Date)).toBe('Invalid date');
            expect(formatDateTime('invalid-date')).toBe('Invalid date');
        });
    });

    describe('formatDateTime', () => {
        it('should format with PPpp pattern', () => {
            const result = formatDateTime(TEST_DATE);
            expect(result).toMatch(/2023/); // Should contain year
        });
    });

    describe('formatTimeAgo', () => {
        it('should format relative time correctly', () => {
            const now = Date.now();
            const past = now - 1000 * 60 * 60; // 1 hour ago

            expect(formatTimeAgo(past, 'en')).toContain('about 1 hour ago');
        });

        it('should handle invalid date', () => {
            expect(formatTimeAgo('invalid')).toBe('Invalid date');
        });
    });

    describe('formatRelativeDate', () => {
        it('should format relative date correctly', () => {
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);

            const result = formatRelativeDate(yesterday, 'en');
            expect(result).toBeTruthy();
            expect(result.toLowerCase()).toContain('yesterday');
        });
        it('should handle invalid date', () => {
            expect(formatRelativeDate('invalid')).toBe('Invalid date');
        });
    });

    describe('formatShortDate', () => {
        it('should format short date correctly', () => {
            const result = formatShortDate(TEST_DATE);
            // e.g. Dec 25, 18:30
            expect(result).toContain('Dec 25');
        });
    });

    describe('formatUnlockTime', () => {
        it('should format unlock time correctly', () => {
            const result = formatUnlockTime(TEST_DATE);
            expect(result).toBeTruthy();
        });
    });
});

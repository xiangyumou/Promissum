import { describe, it, expect } from 'vitest';
import {
    getDateLocale,
    formatDate,
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
            expect(formatted).toContain('2024-02-29');
        });

        it('should return safe defaults for invalid inputs', () => {
            expect(formatDate(null as unknown as Date)).toBe('Invalid date');
            expect(formatDate(undefined as unknown as Date)).toBe('Invalid date');
        });
    });

    describe('formatUnlockTime', () => {
        it('should format unlock time correctly', () => {
            const result = formatUnlockTime(TEST_DATE);
            expect(result).toBeTruthy();
        });
    });
});

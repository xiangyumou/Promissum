import { describe, it, expect } from 'vitest';
import { calculateDurationMinutes, calculateUnlockTimeInfo } from '@/lib/utils/unlock-time';

describe('Unlock Time Utilities', () => {
    describe('calculateDurationMinutes', () => {
        it('returns accumulated duration in duration mode', () => {
            const result = calculateDurationMinutes('duration', 60, {
                year: '2024', month: '1', day: '1', hour: '12', minute: '00'
            });
            expect(result).toBe(60);
        });

        it('returns minimum 1 minute in duration mode', () => {
            const result = calculateDurationMinutes('duration', 0, {
                year: '2024', month: '1', day: '1', hour: '12', minute: '00'
            });
            expect(result).toBe(1);
        });

        it('calculates minutes difference in absolute mode', () => {
            const now = new Date(2023, 0, 1, 10, 0).getTime(); // Jan 1 2023 10:00
            const absoluteTime = {
                year: '23', month: '1', day: '1', hour: '11', minute: '00'
            }; // Jan 1 2023 11:00

            const result = calculateDurationMinutes('absolute', 0, absoluteTime, now);
            expect(result).toBe(60); // 1 hour difference
        });
    });

    describe('calculateUnlockTimeInfo', () => {
        it('formats date correctly in duration mode', () => {
            const now = new Date(2023, 0, 1, 10, 0).getTime();
            const result = calculateUnlockTimeInfo(60, 'duration', {
                year: '0', month: '0', day: '0', hour: '0', minute: '0'
            }, now);

            expect(result.formatted).toBe('01-01 11:00');
            expect(result.isValid).toBe(true);
            expect(result.remaining).toContain('1h');
        });

        it('identifies invalid duration', () => {
            const now = new Date(2023, 0, 1, 10, 0).getTime();
            const result = calculateUnlockTimeInfo(-10, 'duration', {
                year: '0', month: '0', day: '0', hour: '0', minute: '0'
            }, now);

            expect(result.isValid).toBe(false);
        });
    });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { timeService, isTimeUnlocked, getRemainingTime } from '@/lib/services/time-service';

describe('time-service', () => {
    beforeEach(() => {
        timeService.resetMock();
    });

    afterEach(() => {
        timeService.resetMock();
    });

    describe('timeService.now()', () => {
        it('should return current time when not mocked', () => {
            const before = Date.now();
            const result = timeService.now();
            const after = Date.now();

            expect(result).toBeGreaterThanOrEqual(before);
            expect(result).toBeLessThanOrEqual(after);
        });

        it('should return mocked time when set', () => {
            const mockTimestamp = 1735344000000; // Fixed timestamp
            timeService.setMockTime(mockTimestamp);

            expect(timeService.now()).toBe(mockTimestamp);
        });
    });

    describe('timeService.setMockTime()', () => {
        it('should set the mock time', () => {
            timeService.setMockTime(1000);
            expect(timeService.now()).toBe(1000);
        });

        it('should allow changing mock time', () => {
            timeService.setMockTime(1000);
            expect(timeService.now()).toBe(1000);

            timeService.setMockTime(2000);
            expect(timeService.now()).toBe(2000);
        });
    });

    describe('timeService.resetMock()', () => {
        it('should reset to real time', () => {
            timeService.setMockTime(1000);
            expect(timeService.now()).toBe(1000);

            timeService.resetMock();

            const before = Date.now();
            const result = timeService.now();
            const after = Date.now();

            expect(result).toBeGreaterThanOrEqual(before);
            expect(result).toBeLessThanOrEqual(after);
        });
    });

    describe('timeService.isMocked()', () => {
        it('should return false when not mocked', () => {
            expect(timeService.isMocked()).toBe(false);
        });

        it('should return true when mocked', () => {
            timeService.setMockTime(1000);
            expect(timeService.isMocked()).toBe(true);
        });

        it('should return false after reset', () => {
            timeService.setMockTime(1000);
            expect(timeService.isMocked()).toBe(true);

            timeService.resetMock();
            expect(timeService.isMocked()).toBe(false);
        });
    });

    describe('isTimeUnlocked()', () => {
        it('should return true when target time has passed', () => {
            timeService.setMockTime(2000);
            expect(isTimeUnlocked(1000)).toBe(true);
        });

        it('should return false when target time has not passed', () => {
            timeService.setMockTime(1000);
            expect(isTimeUnlocked(2000)).toBe(false);
        });

        it('should return true when target time equals current time', () => {
            timeService.setMockTime(1000);
            expect(isTimeUnlocked(1000)).toBe(true);
        });

        it('should accept custom current time parameter', () => {
            expect(isTimeUnlocked(1000, 2000)).toBe(true);
            expect(isTimeUnlocked(2000, 1000)).toBe(false);
        });

        it('should handle edge case with 0 timestamp', () => {
            expect(isTimeUnlocked(0, 1000)).toBe(true);
        });

        it('should handle very large timestamps', () => {
            const farFuture = Date.now() + 1000 * 60 * 60 * 24 * 365 * 100; // 100 years
            expect(isTimeUnlocked(farFuture)).toBe(false);
        });
    });

    describe('getRemainingTime()', () => {
        it('should return remaining time in milliseconds', () => {
            timeService.setMockTime(1000);
            expect(getRemainingTime(2000)).toBe(1000);
        });

        it('should return 0 when target time has passed', () => {
            timeService.setMockTime(2000);
            expect(getRemainingTime(1000)).toBe(0);
        });

        it('should return 0 when target time equals current time', () => {
            timeService.setMockTime(1000);
            expect(getRemainingTime(1000)).toBe(0);
        });

        it('should accept custom current time parameter', () => {
            expect(getRemainingTime(3000, 1000)).toBe(2000);
            expect(getRemainingTime(1000, 2000)).toBe(0);
        });

        it('should never return negative values', () => {
            timeService.setMockTime(5000);
            expect(getRemainingTime(1000)).toBe(0);
            expect(getRemainingTime(0)).toBe(0);
        });

        it('should handle large time differences', () => {
            const oneYear = 1000 * 60 * 60 * 24 * 365;
            timeService.setMockTime(0);
            expect(getRemainingTime(oneYear)).toBe(oneYear);
        });
    });

    describe('Integration', () => {
        it('should work correctly together for lock status checks', () => {
            const lockTime = 5000;

            // Before unlock time
            timeService.setMockTime(3000);
            expect(isTimeUnlocked(lockTime)).toBe(false);
            expect(getRemainingTime(lockTime)).toBe(2000);

            // At unlock time
            timeService.setMockTime(5000);
            expect(isTimeUnlocked(lockTime)).toBe(true);
            expect(getRemainingTime(lockTime)).toBe(0);

            // After unlock time
            timeService.setMockTime(7000);
            expect(isTimeUnlocked(lockTime)).toBe(true);
            expect(getRemainingTime(lockTime)).toBe(0);
        });
    });
});

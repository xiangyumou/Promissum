/**
 * Time Service
 *
 * Abstraction layer for time-related operations.
 * Allows mocking time in tests without affecting production code.
 *
 * Usage:
 *   import { timeService } from '@/lib/services/time-service';
 *   const now = timeService.now();
 *
 * Testing:
 *   import { timeService } from '@/lib/services/time-service';
 *   timeService.setMockTime(1735344000000); // Set to specific timestamp
 *   // ... run tests
 *   timeService.resetMock(); // Reset after tests
 */

export interface ITimeService {
    /**
     * Get current timestamp in milliseconds
     */
    now(): number;

    /**
     * Set a mock time for testing (no-op in production if desired)
     */
    setMockTime(time: number): void;

    /**
     * Reset to real time
     */
    resetMock(): void;

    /**
     * Check if currently using mock time
     */
    isMocked(): boolean;
}

let mockTime: number | null = null;

export const timeService: ITimeService = {
    now: () => mockTime ?? Date.now(),

    setMockTime: (time: number) => {
        mockTime = time;
    },

    resetMock: () => {
        mockTime = null;
    },

    isMocked: () => mockTime !== null,
};

/**
 * Helper: Check if a target time has passed
 */
export function isTimeUnlocked(
    targetTime: number,
    currentTime = timeService.now()
): boolean {
    return currentTime >= targetTime;
}

/**
 * Helper: Calculate remaining time in milliseconds
 */
export function getRemainingTime(
    targetTime: number,
    currentTime = timeService.now()
): number {
    return Math.max(0, targetTime - currentTime);
}

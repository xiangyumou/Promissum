import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCountdown } from '@/hooks/useCountdown';
import { timeService } from '@/lib/services/time-service';

vi.mock('@/lib/services/time-service', () => ({
    timeService: {
        now: vi.fn()
    }
}));

describe('useCountdown', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.mocked(timeService.now).mockReturnValue(1000);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('should initialize with correct remaining time', () => {
        const target = 5000;
        const { result } = renderHook(() => useCountdown(target));
        // 5000 - 1000 = 4000
        expect(result.current).toBe(4000);
    });

    it('should decrement over time', () => {
        const target = 5000;
        const { result } = renderHook(() => useCountdown(target));

        // Advance time by 1s
        vi.mocked(timeService.now).mockReturnValue(2000);
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current).toBe(3000);
    });

    it('should stop at 0', () => {
        const target = 2000;
        const { result } = renderHook(() => useCountdown(target));

        // Advance past target
        vi.mocked(timeService.now).mockReturnValue(3000);
        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(result.current).toBe(0);
    });

    describe('Edge Cases', () => {
        it('should handle target time in the past', () => {
            vi.mocked(timeService.now).mockReturnValue(5000);
            const target = 2000; // In the past
            const { result } = renderHook(() => useCountdown(target));

            // Should immediately show 0
            expect(result.current).toBe(0);
        });

        it('should handle target time equal to current time', () => {
            const now = 5000;
            vi.mocked(timeService.now).mockReturnValue(now);
            const { result } = renderHook(() => useCountdown(now));

            // Should show 0 when equal
            expect(result.current).toBe(0);
        });

        it('should handle very large time difference', () => {
            vi.mocked(timeService.now).mockReturnValue(1000);
            const yearsInFuture = 1000 + (365 * 24 * 60 * 60 * 1000 * 10); // 10 years
            const { result } = renderHook(() => useCountdown(yearsInFuture));

            // Should handle large numbers
            expect(result.current).toBe(yearsInFuture - 1000);
            expect(result.current).toBeGreaterThan(0);
        });

        it('should handle negative target time', () => {
            vi.mocked(timeService.now).mockReturnValue(1000);
            const { result } = renderHook(() => useCountdown(-5000));

            // Negative target should result in 0 (past)
            expect(result.current).toBe(0);
        });

        it('should update when target changes', () => {
            const firstTarget = 5000;
            const secondTarget = 10000;
            vi.mocked(timeService.now).mockReturnValue(1000);

            const { result, rerender } = renderHook(
                ({ target }) => useCountdown(target),
                { initialProps: { target: firstTarget } }
            );

            expect(result.current).toBe(4000);

            // Change target
            rerender({ target: secondTarget });

            expect(result.current).toBe(9000);
        });

        it('should cleanup timer on unmount', () => {
            const target = 5000;
            vi.mocked(timeService.now).mockReturnValue(1000);

            const { unmount } = renderHook(() => useCountdown(target));

            // Unmount should clear interval
            unmount();

            // If we advance time after unmount, no updates should happen
            // This is implicitly tested - no errors should occur
            act(() => {
                vi.advanceTimersByTime(10000);
            });
        });

        it('should handle custom interval', () => {
            const target = 5000;
            vi.mocked(timeService.now).mockReturnValue(1000);

            const { result } = renderHook(() => useCountdown(target, { interval: 500 }));

            expect(result.current).toBe(4000);

            // Advance by 500ms (custom interval)
            vi.mocked(timeService.now).mockReturnValue(1500);
            act(() => {
                vi.advanceTimersByTime(500);
            });

            expect(result.current).toBe(3500);
        });

        it('should never show negative values', () => {
            const target = 2000;
            vi.mocked(timeService.now).mockReturnValue(1000);

            const { result } = renderHook(() => useCountdown(target));

            // Advance way past target
            vi.mocked(timeService.now).mockReturnValue(10000);
            act(() => {
                vi.advanceTimersByTime(10000);
            });

            // Should still be 0, not negative
            expect(result.current).toBe(0);
            expect(result.current).toBeGreaterThanOrEqual(0);
        });
    });
});

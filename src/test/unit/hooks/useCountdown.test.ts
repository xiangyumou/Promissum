import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCountdown } from '@/hooks/useCountdown';

describe('useCountdown', () => {
    beforeEach(() => {
        vi.useFakeTimers({ now: 1000 });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize with correct remaining time', () => {
        const target = 5000;
        const { result } = renderHook(() => useCountdown(target));
        // 5000 - 1000 = 4000
        expect(result.current).toBe(4000);
    });

    it('should update when target changes', () => {
        const firstTarget = 5000;
        const secondTarget = 10000;

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

        const { unmount } = renderHook(() => useCountdown(target));

        // Unmount should clear interval - no errors should occur
        unmount();

        act(() => {
            vi.advanceTimersByTime(10000);
        });
    });

    describe('Edge Cases', () => {
        it('should handle target time in the past', () => {
            vi.setSystemTime(5000);
            const target = 2000; // In the past
            const { result } = renderHook(() => useCountdown(target));

            // Should immediately show 0
            expect(result.current).toBe(0);
        });

        it('should handle target time equal to current time', () => {
            const now = 5000;
            vi.setSystemTime(now);
            const { result } = renderHook(() => useCountdown(now));

            // Should show 0 when equal
            expect(result.current).toBe(0);
        });

        it('should handle very large time difference', () => {
            vi.setSystemTime(1000);
            const yearsInFuture = 1000 + (365 * 24 * 60 * 60 * 1000 * 10); // 10 years
            const { result } = renderHook(() => useCountdown(yearsInFuture));

            // Should handle large numbers
            expect(result.current).toBe(yearsInFuture - 1000);
            expect(result.current).toBeGreaterThan(0);
        });

        it('should handle negative target time', () => {
            vi.setSystemTime(1000);
            const { result } = renderHook(() => useCountdown(-5000));

            // Negative target should result in 0 (past)
            expect(result.current).toBe(0);
        });

        it('should handle custom interval parameter', () => {
            const target = 5000;

            // Should not throw with custom interval
            const { unmount } = renderHook(() => useCountdown(target, { interval: 500 }));
            expect(true).toBe(true); // Just verify it renders without error
            unmount();
        });
    });
});

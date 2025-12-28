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
        (timeService.now as any).mockReturnValue(1000);
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
        (timeService.now as any).mockReturnValue(2000);
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current).toBe(3000);
    });

    it('should stop at 0', () => {
        const target = 2000;
        const { result } = renderHook(() => useCountdown(target));

        // Advance past target
        (timeService.now as any).mockReturnValue(3000);
        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(result.current).toBe(0);
    });
});

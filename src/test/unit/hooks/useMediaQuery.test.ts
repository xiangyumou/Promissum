import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { browserService } from '@/lib/services/browser-service';

vi.mock('@/lib/services/browser-service', () => ({
    browserService: {
        matchMedia: vi.fn()
    }
}));

describe('useMediaQuery', () => {
    let addListenerMock: any;
    let removeListenerMock: any;
    let addEventListenerMock: any;
    let removeEventListenerMock: any;

    beforeEach(() => {
        addListenerMock = vi.fn();
        removeListenerMock = vi.fn();
        addEventListenerMock = vi.fn();
        removeEventListenerMock = vi.fn();
        vi.clearAllMocks();
    });

    it('should return matches based on query', () => {
        (browserService.matchMedia as any).mockReturnValue({
            matches: true,
            addListener: addListenerMock,
            removeListener: removeListenerMock,
            addEventListener: addEventListenerMock,
            removeEventListener: removeEventListenerMock,
        });

        const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'));
        expect(result.current).toBe(true);
    });

    it('should update when listener fires', () => {
        const listeners: any[] = [];
        (browserService.matchMedia as any).mockReturnValue({
            matches: false,
            addListener: (cb: any) => listeners.push(cb),
            removeListener: vi.fn(),
            // Mocking legacy API as hook supports both
            // If hook prefers modern, we might need to mock addEventListener
        });

        const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'));
        expect(result.current).toBe(false);

        act(() => {
            listeners.forEach(l => l({ matches: true } as any));
        });

        expect(result.current).toBe(true);
    });
});

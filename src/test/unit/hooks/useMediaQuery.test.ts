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
    let addListenerMock: ReturnType<typeof vi.fn>;
    let removeListenerMock: ReturnType<typeof vi.fn>;
    let addEventListenerMock: ReturnType<typeof vi.fn>;
    let removeEventListenerMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        addListenerMock = vi.fn();
        removeListenerMock = vi.fn();
        addEventListenerMock = vi.fn();
        removeEventListenerMock = vi.fn();
        vi.clearAllMocks();
    });

    it('should return matches based on query', () => {
        vi.mocked(browserService.matchMedia).mockReturnValue({
            matches: true,
            addListener: addListenerMock,
            removeListener: removeListenerMock,
            addEventListener: addEventListenerMock,
            removeEventListener: removeEventListenerMock,
        } as unknown as MediaQueryList);

        const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'));
        expect(result.current).toBe(true);
    });

    it('should update when listener fires', () => {
        const listeners: ((event: MediaQueryListEvent) => void)[] = [];
        vi.mocked(browserService.matchMedia).mockReturnValue({
            matches: false,
            addListener: (cb: (event: MediaQueryListEvent) => void) => listeners.push(cb),
            removeListener: vi.fn(),
            // Mocking legacy API as hook supports both
            // If hook prefers modern, we might need to mock addEventListener
        } as unknown as MediaQueryList);

        const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'));
        expect(result.current).toBe(false);

        act(() => {
            listeners.forEach(l => l({ matches: true } as unknown as MediaQueryListEvent));
        });

        expect(result.current).toBe(true);
    });
});

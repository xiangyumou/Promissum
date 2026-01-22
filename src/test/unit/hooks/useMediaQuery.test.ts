import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMediaQuery } from '@/hooks/useMediaQuery';

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

        // Mock window.matchMedia
        global.matchMedia = vi.fn().mockImplementation(() => ({
            matches: false,
            addListener: addListenerMock,
            removeListener: removeListenerMock,
            addEventListener: addEventListenerMock,
            removeEventListener: removeEventListenerMock,
        })) as unknown as typeof window.matchMedia;
    });

    it('should return matches based on query', () => {
        (global.matchMedia as ReturnType<typeof vi.fn>).mockReturnValue({
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
        const listeners: (() => void)[] = [];
        let currentMatches = false;

        (global.matchMedia as ReturnType<typeof vi.fn>).mockImplementation(() => ({
            get matches() { return currentMatches; },
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: (type: string, cb: () => void) => {
                if (type === 'change') listeners.push(cb);
            },
            removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList);

        const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'));
        expect(result.current).toBe(false);

        // Update the matches value and trigger listeners
        currentMatches = true;
        act(() => {
            listeners.forEach(l => l());
        });

        expect(result.current).toBe(true);
    });
});

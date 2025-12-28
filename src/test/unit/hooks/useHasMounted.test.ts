import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useHasMounted } from '@/hooks/useHasMounted';

describe('useHasMounted', () => {
    it('should return true after mount', async () => {
        const { result } = renderHook(() => useHasMounted());

        // After render, the effect runs and sets hasMounted to true
        await waitFor(() => expect(result.current).toBe(true));
    });

    it('should remain true across re-renders', async () => {
        const { result, rerender } = renderHook(() => useHasMounted());

        await waitFor(() => expect(result.current).toBe(true));

        // Re-render multiple times
        rerender();
        expect(result.current).toBe(true);

        rerender();
        expect(result.current).toBe(true);
    });

    it('should be consistent across multiple hook instances', async () => {
        const { result: result1 } = renderHook(() => useHasMounted());
        const { result: result2 } = renderHook(() => useHasMounted());

        await waitFor(() => {
            expect(result1.current).toBe(true);
            expect(result2.current).toBe(true);
        });
    });
});


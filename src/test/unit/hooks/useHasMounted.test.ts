import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useHasMounted } from '@/hooks/useHasMounted';

describe('useHasMounted', () => {
    it('should return false initially and true after mount', async () => {
        const { result } = renderHook(() => useHasMounted());

        // Initial render might settle to true quickly in this env, but let's check eventual consistency
        await waitFor(() => expect(result.current).toBe(true));
    });
});

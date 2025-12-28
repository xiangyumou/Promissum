import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSessions } from '@/hooks/useSessions';
import { createWrapper } from '../../utils';

describe('useSessions hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Global fetch mock
        global.fetch = vi.fn();
    });

    it('should return empty array if no itemId provided', async () => {
        const { result } = renderHook(() => useSessions(null), {
            wrapper: createWrapper()
        });

        expect(result.current.data).toBeUndefined();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch sessions for a given itemId', async () => {
        const mockSessions = [{ id: 's1', deviceId: 'd1', lastActive: Date.now() }];
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockSessions
        });

        const { result } = renderHook(() => useSessions('test-item'), {
            wrapper: createWrapper()
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockSessions);
        expect(global.fetch).toHaveBeenCalledWith('/api/sessions?itemId=test-item');
    });

    it('should handle fetch errors', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 500
        });

        const { result } = renderHook(() => useSessions('test-item'), {
            wrapper: createWrapper()
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error).toBeDefined();
    });
});

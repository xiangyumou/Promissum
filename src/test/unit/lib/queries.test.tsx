import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStats, useItems, useItem, queryKeys } from '@/lib/queries';
import { createWrapper } from '@/test/utils';
import { useSettings } from '@/lib/stores/settings-store';

// Mock API service functions
vi.mock('@/lib/services/api-service', () => ({
    getStats: vi.fn(),
    getItems: vi.fn(),
    getItem: vi.fn(),
    createItem: vi.fn(),
    deleteItem: vi.fn(),
    extendItem: vi.fn(),
}));

// Mock useSettings
vi.mock('@/lib/stores/settings-store', () => ({
    useSettings: vi.fn()
}));

// Import the mocked functions
import { getStats, getItems, getItem } from '@/lib/services/api-service';

describe('queries hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default settings - use partial mock that returns values for used selectors
        vi.mocked(useSettings).mockImplementation((selector) => {
            const state = {
                cacheTTLMinutes: 5,
                autoRefreshInterval: 60
            };

            return (selector as (s: typeof state) => unknown)(state) as any;
        });
    });

    describe('useStats', () => {
        it('should fetch stats', async () => {
            vi.mocked(getStats).mockResolvedValue({ totalItems: 10, lockedItems: 5, unlockedItems: 5, byType: { text: 6, image: 4 } });
            const { result } = renderHook(() => useStats(), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.totalItems).toBe(10);
        });

        it('should handle error state', async () => {
            vi.mocked(getStats).mockRejectedValue(new Error('Server error'));
            const { result } = renderHook(() => useStats(), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.isError).toBe(true));
            expect(result.current.error?.message).toBe('Server error');
        });
    });

    describe('useItems', () => {
        it('should fetch items', async () => {
            vi.mocked(getItems).mockResolvedValue([{ id: '1', type: 'text', decrypt_at: 1000, unlocked: false, content: null }]);
            const { result } = renderHook(() => useItems(), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toHaveLength(1);
        });

        it('should fetch items with filters', async () => {
            vi.mocked(getItems).mockResolvedValue([{ id: '1', type: 'text', decrypt_at: 1000, unlocked: false, content: null }]);
            const filters = { status: 'locked' as const, type: 'text' as const };
            renderHook(() => useItems(filters), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(getItems).toHaveBeenCalledWith(filters);
            });
        });

        it('should handle empty result', async () => {
            vi.mocked(getItems).mockResolvedValue([]);
            const { result } = renderHook(() => useItems(), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual([]);
        });
    });

    describe('useItem', () => {
        it('should fetch item detail', async () => {
            vi.mocked(getItem).mockResolvedValue({ id: '1', type: 'text', decrypt_at: 1000, unlocked: false, content: null });
            const { result } = renderHook(() => useItem('1'), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.id).toBe('1');
        });

        it('should not fetch if id is null', () => {
            const { result } = renderHook(() => useItem(null), { wrapper: createWrapper() });
            expect(result.current.fetchStatus).toBe('idle');
        });

        it('should handle 404 error', async () => {
            const error = new Error('Not found');
            (error as Error & { status: number }).status = 404;
            vi.mocked(getItem).mockRejectedValue(error);

            const { result } = renderHook(() => useItem('missing'), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.isError).toBe(true));
        });
    });

    describe('queryKeys', () => {
        it('should have correct structure', () => {
            expect(queryKeys.stats).toEqual(['stats']);
            expect(queryKeys.items.all).toEqual(['items']);
            expect(queryKeys.items.list({ status: 'locked' })).toEqual(['items', 'list', { status: 'locked' }]);
            expect(queryKeys.items.detail('123')).toEqual(['items', 'detail', '123']);
        });
    });
});

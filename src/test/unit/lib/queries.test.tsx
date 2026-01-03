import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStats, useItems, useItem, queryKeys } from '@/lib/queries';
import { apiService } from '@/lib/services/api-service';
import { timeService } from '@/lib/services/time-service';
import { createWrapper } from '@/test/utils';
import { useSettings } from '@/lib/stores/settings-store';

// Mock apiService
vi.mock('@/lib/services/api-service', () => ({
    apiService: {
        getStats: vi.fn(),
        getItems: vi.fn(),
        getItem: vi.fn(),
        createItem: vi.fn(),
        deleteItem: vi.fn(),
        extendItem: vi.fn(),
    }
}));

// Mock useSettings
vi.mock('@/lib/stores/settings-store', () => ({
    useSettings: vi.fn()
}));

// Mock timeService
vi.mock('@/lib/services/time-service', () => ({
    timeService: {
        now: vi.fn()
    }
}));

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
        vi.mocked(timeService.now).mockReturnValue(1000000);
    });

    describe('useStats', () => {
        it('should fetch stats', async () => {
            vi.mocked(apiService.getStats).mockResolvedValue({ totalItems: 10, lockedItems: 5, unlockedItems: 5, byType: { text: 6, image: 4 } });
            const { result } = renderHook(() => useStats(), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.totalItems).toBe(10);
        });

        it('should handle error state', async () => {
            vi.mocked(apiService.getStats).mockRejectedValue(new Error('Server error'));
            const { result } = renderHook(() => useStats(), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.isError).toBe(true));
            expect(result.current.error?.message).toBe('Server error');
        });
    });

    describe('useItems', () => {
        it('should fetch items', async () => {
            vi.mocked(apiService.getItems).mockResolvedValue([{ id: '1', type: 'text', decrypt_at: 1000, unlocked: false, content: null }]);
            const { result } = renderHook(() => useItems(), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toHaveLength(1);
        });

        it('should fetch items with filters', async () => {
            vi.mocked(apiService.getItems).mockResolvedValue([{ id: '1', type: 'text', decrypt_at: 1000, unlocked: false, content: null }]);
            const filters = { status: 'locked' as const, type: 'text' as const };
            renderHook(() => useItems(filters), { wrapper: createWrapper() });

            await waitFor(() => {
                expect(apiService.getItems).toHaveBeenCalledWith(filters);
            });
        });

        it('should handle empty result', async () => {
            vi.mocked(apiService.getItems).mockResolvedValue([]);
            const { result } = renderHook(() => useItems(), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual([]);
        });
    });

    describe('useItem', () => {
        it('should fetch item detail', async () => {
            vi.mocked(apiService.getItem).mockResolvedValue({ id: '1', type: 'text', decrypt_at: 1000, unlocked: false, content: null });
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
            vi.mocked(apiService.getItem).mockRejectedValue(error);

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

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStats, useItems, useItem } from '@/lib/queries';
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
        // Default settings
        (useSettings as any).mockImplementation((selector: any) => {
            const state = {
                cacheTTLMinutes: 5,
                autoRefreshInterval: 60
            };
            return selector(state);
        });
        (timeService.now as any).mockReturnValue(1000000);
    });

    describe('useStats', () => {
        it('should fetch stats', async () => {
            (apiService.getStats as any).mockResolvedValue({ totalItems: 10 });
            const { result } = renderHook(() => useStats(), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual({ totalItems: 10 });
        });
    });

    describe('useItems', () => {
        it('should fetch items', async () => {
            (apiService.getItems as any).mockResolvedValue([{ id: '1' }]);
            const { result } = renderHook(() => useItems(), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toHaveLength(1);
        });
    });

    describe('useItem', () => {
        it('should fetch item detail', async () => {
            (apiService.getItem as any).mockResolvedValue({ id: '1', unlocked: false });
            const { result } = renderHook(() => useItem('1'), { wrapper: createWrapper() });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual({ id: '1', unlocked: false });
        });

        it('should not fetch if id is null', () => {
            const { result } = renderHook(() => useItem(null), { wrapper: createWrapper() });
            expect(result.current.fetchStatus).toBe('idle');
        });
    });
});

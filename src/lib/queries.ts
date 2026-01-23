/**
 * TanStack Query Hooks for Promissum API
 *
 * Centralized data fetching hooks with automatic caching and revalidation.
 * Uses the local API routes which directly call service functions.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSettings } from '@/lib/stores/settings-store';
import {
    getItems,
    getItem,
    createItem,
    extendItem,
    deleteItem,
    getStats,
    type ApiItemResponse
} from './services/api-service';
import { timeService } from './services/time-service';
import type { FilterParams } from '@/lib/types';
import {
    POLLING_INTERVAL,
    NEAR_UNLOCK_THRESHOLD_MS,
    MAX_API_RETRIES,
} from '@/lib/constants';

export type { FilterParams };

/**
 * Custom API Error with status code
 */
class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

/**
 * Query Keys
 * Organized hierarchically for easy invalidation
 */
export const queryKeys = {
    stats: ['stats'] as const,
    items: {
        all: ['items'] as const,
        list: (filters?: FilterParams) => ['items', 'list', filters] as const,
        detail: (id: string) => ['items', 'detail', id] as const,
    },
};

/**
 * Hook: Fetch system statistics
 */
export function useStats() {
    const cacheTTLMinutes = useSettings(state => state.cacheTTLMinutes);
    const cacheTime = useMemo(() => cacheTTLMinutes * 60 * 1000, [cacheTTLMinutes]);

    return useQuery({
        queryKey: queryKeys.stats,
        queryFn: () => getStats(),
        staleTime: cacheTime,
        gcTime: cacheTime,
    });
}


/**
 * Hook: Fetch items list with optional filtering
 */
export function useItems(filters?: FilterParams) {
    const autoRefreshInterval = useSettings(state => state.autoRefreshInterval);
    const cacheTTLMinutes = useSettings(state => state.cacheTTLMinutes);
    const cacheTime = useMemo(() => cacheTTLMinutes * 60 * 1000, [cacheTTLMinutes]);

    return useQuery({
        queryKey: queryKeys.items.list(filters),
        queryFn: () => getItems(filters),
        staleTime: cacheTime,
        gcTime: cacheTime,
        // Refetch based on settings (convert seconds to ms)
        // 0 means disabled, but refetchInterval number expects ms. 0 or false disables it.
        refetchInterval: autoRefreshInterval > 0 ? autoRefreshInterval * 1000 : false,
    });
}

/**
 * Hook: Fetch item detail by ID
 * Note: Response uses snake_case (decrypt_at) from local API routes
 */
export function useItem(id: string | null) {
    const cacheTTLMinutes = useSettings(state => state.cacheTTLMinutes);
    const cacheTime = useMemo(() => cacheTTLMinutes * 60 * 1000, [cacheTTLMinutes]);

    return useQuery({
        queryKey: queryKeys.items.detail(id!),
        queryFn: async () => {
            try {
                return await getItem(id!);
            } catch (error: unknown) {
                const err = error as Error & { status?: number };
                if (err.status) {
                    throw new ApiError('Failed to fetch item', err.status);
                }
                throw error;
            }
        },
        enabled: !!id, // Only fetch if id exists
        staleTime: cacheTime,
        gcTime: cacheTime,
        retry: (failureCount, error) => {
            if (error instanceof ApiError && error.status === 404) {
                return false;
            }
            return failureCount < MAX_API_RETRIES;
        },
        refetchInterval: (query) => {
            if (query.state.error instanceof ApiError && query.state.error.status === 404) {
                return false;
            }

            const data = query.state.data as ApiItemResponse | undefined;
            if (!data) return POLLING_INTERVAL.INITIAL_MS;

            if (data.unlocked) {
                return false;
            }

            const now = timeService.now();
            const timeRemaining = data.decrypt_at - now;

            if (timeRemaining <= NEAR_UNLOCK_THRESHOLD_MS) {
                return POLLING_INTERVAL.FAST_MS;
            }

            return POLLING_INTERVAL.DEFAULT_MS;
        }
    });
}

export function useDeleteItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.stats });
        },
    });
}

interface ExtendItemParams {
    id: string;
    minutes: number;
}

export function useExtendItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, minutes }: ExtendItemParams) => extendItem(id, minutes),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
        },
    });
}

export function useCreateItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (formData: FormData) => createItem(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.stats });
        },
    });
}

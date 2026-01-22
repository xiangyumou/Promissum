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

/**
 * Filter parameters for TanStack Query hooks.
 * Note: This is a simplified version of FilterParams from types.ts,
 * tailored for the UI's filtering needs.
 */
export interface FilterParams {
    status?: 'all' | 'locked' | 'unlocked';
    type?: 'text' | 'image';
    sort?: 'created_asc' | 'created_desc' | 'decrypt_asc' | 'decrypt_desc';
    search?: string;
}

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
        // Don't retry specifically on 404s
        retry: (failureCount, error) => {
            if (error instanceof ApiError && error.status === 404) {
                return false;
            }
            return failureCount < 3;
        },
        // Dynamic refetch polling
        refetchInterval: (query) => {
            // Stop polling on 404
            if (query.state.error instanceof ApiError && query.state.error.status === 404) {
                return false;
            }

            const data = query.state.data as ApiItemResponse | undefined;
            if (!data) return 1000; // Poll faster if no data yet (maybe loading/error fallback)

            // If already unlocked, no need to poll frequently
            if (data.unlocked) {
                return false;
            }

            // Calculate time remaining
            const now = timeService.now();
            const timeRemaining = data.decrypt_at - now;

            // If time is up or close (within 1 minute), poll faster (5s) to catch unlock
            if (timeRemaining <= 60000) {
                return 5000;
            }

            return 60000;
        }
    });
}

/**
 * Hook: Delete item mutation
 */
export function useDeleteItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteItem(id),
        onSuccess: () => {
            // Invalidate items list to refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
            // Invalidate stats
            queryClient.invalidateQueries({ queryKey: queryKeys.stats });
        },
    });
}

/**
 * Hook: Extend item lock mutation
 */
export function useExtendItem(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (minutes: number) => extendItem(id, minutes),
        onSuccess: () => {
            // Invalidate this item's detail
            queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(id) });
            // Invalidate items list
            queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
        },
    });
}

/**
 * Hook: Create item mutation
 */
export function useCreateItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (formData: FormData) => createItem(formData),
        onSuccess: () => {
            // Invalidate items list
            queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
            // Invalidate stats
            queryClient.invalidateQueries({ queryKey: queryKeys.stats });
        },
    });
}

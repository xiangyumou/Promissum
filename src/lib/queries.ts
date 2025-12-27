/**
 * TanStack Query Hooks for Chaster API
 * 
 * Centralized data fetching hooks with automatic caching and revalidation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SystemStats, FilterParams, ApiItemListView } from './api-client';
import { ItemDetail } from './types';

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

import { useSettings } from '@/lib/stores/settings-store';

/**
 * Hook: Fetch system statistics
 */
export function useStats() {
    return useQuery({
        queryKey: queryKeys.stats,
        queryFn: async (): Promise<SystemStats> => {
            const response = await fetch('/api/stats');
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            return response.json();
        },
    });
}


/**
 * Hook: Fetch items list with optional filtering
 */
export function useItems(filters?: FilterParams) {
    const { autoRefreshInterval } = useSettings();

    return useQuery({
        queryKey: queryKeys.items.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams();

            if (filters?.status && filters.status !== 'all') {
                params.set('status', filters.status);
            }
            if (filters?.type) {
                params.set('type', filters.type);
            }
            params.set('sort', filters?.sort || 'created_desc');

            const queryString = params.toString();
            const url = `/api/items${queryString ? `?${queryString}` : ''}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch items');
            }

            const data = await response.json();
            return data.items || [];
        },
        // Refetch based on settings (convert seconds to ms)
        // 0 means disabled, but refetchInterval number expects ms. 0 or false disables it.
        refetchInterval: autoRefreshInterval > 0 ? autoRefreshInterval * 1000 : false,
    });
}

/**
 * Hook: Fetch item detail by ID
 */
export function useItem(id: string | null) {
    return useQuery({
        queryKey: queryKeys.items.detail(id!),
        queryFn: async () => {
            const response = await fetch(`/api/items/${id}`);
            if (!response.ok) {
                throw new ApiError('Failed to fetch item', response.status);
            }
            return response.json() as Promise<ItemDetail>;
        },
        enabled: !!id, // Only fetch if id exists
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

            const data = query.state.data;
            if (!data) return 1000; // Poll faster if no data yet (maybe loading/error fallback)

            // If already unlocked, no need to poll frequently
            if (data.unlocked) {
                return false;
            }

            // Calculate time remaining
            const now = Date.now();
            const timeRemaining = data.decrypt_at - now;

            // If time is up or close (within 1 minute), poll faster (5s) to catch unlock
            if (timeRemaining <= 60000) {
                return 5000;
            }

            // Otherwise poll slower (60s) to save resources
            // The local countdown timer handles the visual updates
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
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/items/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                // Ignore 404s during delete, treat as success (idempotent)
                if (response.status === 404) {
                    return { success: true };
                }
                throw new Error('Failed to delete item');
            }
            return response.json();
        },
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
        mutationFn: async (minutes: number) => {
            const response = await fetch(`/api/items/${id}/extend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ minutes }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to extend lock');
            }

            return response.json();
        },
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
        mutationFn: async (formData: FormData) => {
            const response = await fetch('/api/items', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to create item');
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate items list
            queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
            // Invalidate stats
            queryClient.invalidateQueries({ queryKey: queryKeys.stats });
        },
    });
}

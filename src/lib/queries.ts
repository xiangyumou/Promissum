/**
 * TanStack Query Hooks for Chaster API
 * 
 * Centralized data fetching hooks with automatic caching and revalidation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SystemStats, FilterParams, ApiItemListView, ApiItemDetail } from './api-client';

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
        // Refetch every 30 seconds to update lock status
        refetchInterval: 30000,
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
                throw new Error('Failed to fetch item');
            }
            return response.json() as Promise<ApiItemDetail>;
        },
        enabled: !!id, // Only fetch if id exists
        // Refetch every second for countdown updates
        refetchInterval: 1000,
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

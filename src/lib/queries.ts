/**
 * TanStack Query Hooks for Promissum API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getItems,
    getItem,
    createItem,
    deleteItem,
    getStats,
} from './services/api-service';
import type { FilterParams } from '@/lib/types';
import {
    POLLING_INTERVAL_MS,
    MAX_API_RETRIES,
} from '@/lib/constants';

export type { FilterParams };

class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export const queryKeys = {
    stats: ['stats'] as const,
    items: {
        all: ['items'] as const,
        list: (filters?: FilterParams) => ['items', 'list', filters] as const,
        detail: (id: string) => ['items', 'detail', id] as const,
    },
};

export function useStats() {
    return useQuery({
        queryKey: queryKeys.stats,
        queryFn: () => getStats(),
    });
}

export function useItems(filters?: FilterParams) {
    return useQuery({
        queryKey: queryKeys.items.list(filters),
        queryFn: () => getItems(filters),
    });
}

export function useItem(id: string | null) {
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
        enabled: !!id,
        retry: (failureCount, error) => {
            if (error instanceof ApiError && error.status === 404) {
                return false;
            }
            return failureCount < MAX_API_RETRIES;
        },
        refetchInterval: POLLING_INTERVAL_MS,
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

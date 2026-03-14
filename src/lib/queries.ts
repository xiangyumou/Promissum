/**
 * TanStack Query Hooks using Server Actions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getItemsAction,
    getItemAction,
    createItemAction,
    deleteItemAction,
    getStatsAction,
} from '@/app/actions/items';
import type { FilterParams } from '@/lib/types';
import { POLLING_INTERVAL_MS } from '@/lib/constants';

// Query keys
export const queryKeys = {
    stats: ['stats'] as const,
    items: {
        all: ['items'] as const,
        list: (filters?: FilterParams) => ['items', 'list', filters] as const,
        detail: (id: string) => ['items', 'detail', id] as const,
    },
};

// Helper to unwrap action results
async function unwrapAction<T>(promise: Promise<{ success: true; data: T } | { success: false; error: string }>): Promise<T> {
    const result = await promise;
    if (!result.success) {
        throw new Error(result.error);
    }
    return result.data;
}

export function useStats() {
    return useQuery({
        queryKey: queryKeys.stats,
        queryFn: () => unwrapAction(getStatsAction()),
    });
}

export function useItems(filters?: FilterParams) {
    return useQuery({
        queryKey: queryKeys.items.list(filters),
        queryFn: () => unwrapAction(getItemsAction(filters)),
    });
}

export function useItem(id: string | null) {
    return useQuery({
        queryKey: queryKeys.items.detail(id!),
        queryFn: () => unwrapAction(getItemAction(id!)),
        enabled: !!id,
        refetchInterval: POLLING_INTERVAL_MS,
    });
}

export function useDeleteItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => unwrapAction(deleteItemAction(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.stats });
        },
    });
}

export function useCreateItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: FormData) => {
            const result = await createItemAction(formData);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.stats });
        },
    });
}

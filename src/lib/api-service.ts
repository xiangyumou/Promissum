/**
 * API Service
 *
 * Service functions for interacting with the backend API.
 * Abstracts the actual fetch calls from React Query hooks.
 *
 * Note: This service calls the local Next.js API routes,
 * which in turn call service functions directly. Response format
 * uses snake_case for frontend compatibility.
 */

import type { FilterParams, SystemStats, Item } from '@/lib/types';

// Re-export types for backward compatibility
export type { FilterParams, SystemStats };

// Use Item type directly for consistency
export type ApiItemResponse = Item;

export async function getItems(filters?: FilterParams): Promise<ApiItemResponse[]> {
    const params = new URLSearchParams();

    if (filters?.status && filters.status !== 'all') {
        params.set('status', filters.status);
    }
    if (filters?.search) {
        params.set('search', filters.search);
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
}

export async function getItem(id: string): Promise<ApiItemResponse> {
    const response = await fetch(`/api/items/${id}`);
    if (!response.ok) {
        // Throw object with status for useItem error handling
        const error: Error & { status?: number } = new Error('Failed to fetch item');
        error.status = response.status;
        throw error;
    }
    return response.json();
}

export async function createItem(formData: FormData): Promise<{ success: boolean; item: ApiItemResponse }> {
    const response = await fetch('/api/items', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Failed to create item');
    }

    return response.json();
}

export async function deleteItem(id: string): Promise<{ success: boolean }> {
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
}

export async function getStats(): Promise<SystemStats> {
    const response = await fetch('/api/stats');
    if (!response.ok) {
        throw new Error('Failed to fetch stats');
    }
    return response.json();
}

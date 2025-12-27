/**
 * API Service
 *
 * Service layer for interacting with the backend API.
 * Abstracts the actual fetch calls from React Query hooks.
 */

import { FilterParams, SystemStats, ApiItemListView, ApiItemDetail } from '../api-client';

export interface IApiService {
    getItems(filters?: FilterParams): Promise<ApiItemListView[]>;
    getItem(id: string): Promise<ApiItemDetail>;
    createItem(formData: FormData): Promise<{ success: boolean; item: any }>;
    extendItem(id: string, minutes: number): Promise<ApiItemDetail>;
    deleteItem(id: string): Promise<{ success: boolean }>;
    getStats(): Promise<SystemStats>;
}

// Default implementation using fetch
export class ApiService implements IApiService {
    async getItems(filters?: FilterParams): Promise<ApiItemListView[]> {
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
    }

    async getItem(id: string): Promise<ApiItemDetail> {
        const response = await fetch(`/api/items/${id}`);
        if (!response.ok) {
            // Throw object with status for useItem error handling
            const error: any = new Error('Failed to fetch item');
            error.status = response.status;
            throw error;
        }
        return response.json();
    }

    async createItem(formData: FormData): Promise<{ success: boolean; item: any }> {
        const response = await fetch('/api/items', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to create item');
        }

        return response.json();
    }

    async extendItem(id: string, minutes: number): Promise<ApiItemDetail> {
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
    }

    async deleteItem(id: string): Promise<{ success: boolean }> {
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

    async getStats(): Promise<SystemStats> {
        const response = await fetch('/api/stats');
        if (!response.ok) {
            throw new Error('Failed to fetch stats');
        }
        return response.json();
    }
}

export const apiService = new ApiService();

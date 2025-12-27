/**
 * Chaster API Client
 * 
 * Wrapper for calling the remote Chaster encryption service API.
 * Handles authentication, request formatting, and response parsing.
 */

import { env, validateEnv } from './env';
import {
    ApiItemListView,
    ApiItemDetail,
    CreateItemRequest,
    ExtendItemRequest,
    FilterParams,
    SystemStats,
} from './types';

// Re-export types for convenience
export type {
    ApiItemListView,
    ApiItemDetail,
    CreateItemRequest,
    ExtendItemRequest,
    FilterParams,
    SystemStats,
};

// Validate environment on module load
validateEnv();


/**
 * API Client Class
 */
class ChasterApiClient {
    private baseUrl: string;
    private token: string;

    constructor() {
        this.baseUrl = env.apiUrl;
        this.token = env.apiToken;
    }

    /**
     * Make an authenticated API request
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(
                `API request failed: ${response.status} ${response.statusText}\n${error}`
            );
        }

        return response.json();
    }

    /**
     * List all items with optional filtering
     */
    async getItems(params?: FilterParams): Promise<ApiItemListView[]> {
        const queryParams = new URLSearchParams();

        if (params?.status) queryParams.set('status', params.status);
        if (params?.type) queryParams.set('type', params.type);
        if (params?.limit) queryParams.set('limit', params.limit.toString());
        if (params?.offset) queryParams.set('offset', params.offset.toString());
        if (params?.sort) queryParams.set('sort', params.sort);

        const queryString = queryParams.toString();
        const endpoint = `/items${queryString ? `?${queryString}` : ''}`;

        return this.request<ApiItemListView[]>(endpoint);
    }

    /**
     * Create a new encrypted item
     */
    async createItem(data: CreateItemRequest): Promise<ApiItemDetail> {
        return this.request<ApiItemDetail>('/items', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * Get item details by ID (attempts decryption if unlocked)
     */
    async getItemById(id: string): Promise<ApiItemDetail> {
        return this.request<ApiItemDetail>(`/items/${id}`);
    }

    /**
     * Extend the lock duration of an existing item
     */
    async extendItem(id: string, minutes: number): Promise<ApiItemDetail> {
        return this.request<ApiItemDetail>(`/items/${id}/extend`, {
            method: 'POST',
            body: JSON.stringify({ minutes }),
        });
    }

    /**
     * Delete an item permanently
     */
    async deleteItem(id: string): Promise<{ success: boolean }> {
        return this.request<{ success: boolean }>(`/items/${id}`, {
            method: 'DELETE',
        });
    }

    /**
     * Get system statistics
     */
    async getStats(): Promise<SystemStats> {
        return this.request<SystemStats>('/stats');
    }
}

/**
 * Singleton API client instance
 */
export const apiClient = new ChasterApiClient();

/**
 * Helper: Convert File to Base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const dataUrl = reader.result as string;
            // Remove the data:image/xxx;base64, prefix
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

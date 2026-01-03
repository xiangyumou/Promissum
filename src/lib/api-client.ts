/**
 * Chaster API Client
 * 
 * Wrapper for calling the remote Chaster encryption service API.
 * Uses the official @xymou/chaster-client SDK internally.
 * 
 * This module converts SDK camelCase responses to snake_case
 * for frontend compatibility.
 */

import {
    ItemsService,
    SystemService,
    OpenAPI,
    type Item,
    type ItemInput
} from '@xymou/chaster-client';
import { getEffectiveApiUrl, getEffectiveApiToken } from './env';
import { useSettings } from './stores/settings-store';

// ============================================
// Type Definitions (API Response Types - snake_case for frontend)
// ============================================

/**
 * Extended metadata for items
 */
export interface ItemMetadata {
    title?: string;
    tags?: string[];
    [key: string]: unknown;
}

/**
 * Item list view - uses snake_case for frontend compatibility
 */
export interface ApiItemListView {
    id: string;
    type: 'text' | 'image';
    unlocked: boolean;
    decrypt_at: number;
    created_at?: number;
    metadata?: ItemMetadata;
}

/**
 * Full item detail view - uses snake_case for frontend compatibility
 */
export interface ApiItemDetail {
    id: string;
    type: 'text' | 'image';
    unlocked: boolean;
    timeRemainingMs?: number;
    decrypt_at: number;
    content: string | null;
    metadata?: ItemMetadata;
    layer_count?: number;
    original_name?: string | null;
    created_at?: number;
}

/**
 * Request to create a new item
 */
export interface CreateItemRequest {
    type: 'text' | 'image';
    content: string;
    durationMinutes?: number;
    decryptAt?: number;
    metadata?: ItemMetadata;
}

/**
 * Request to extend an item's lock
 */
export interface ExtendItemRequest {
    minutes: number;
}

/**
 * Filter parameters for listing items
 */
export interface FilterParams {
    status?: 'all' | 'locked' | 'unlocked';
    type?: 'text' | 'image';
    search?: string;
    limit?: number;
    offset?: number;
    sort?: 'created_asc' | 'created_desc' | 'decrypt_asc' | 'decrypt_desc';
    dateRange?: {
        start: number;
        end: number;
    };
    quickFilter?: 'unlocking-soon' | 'long-locked' | 'recent';
}

/**
 * System statistics response
 */
export interface SystemStats {
    totalItems: number;
    lockedItems: number;
    unlockedItems: number;
    byType: {
        text: number;
        image: number;
    };
    avgLockDurationMinutes?: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Configure SDK before making requests
 */
function configureSDK(customBaseUrl?: string, customToken?: string) {
    const { apiUrl, apiToken } = useSettings.getState();

    OpenAPI.BASE = customBaseUrl || getEffectiveApiUrl(apiUrl);
    OpenAPI.TOKEN = customToken || getEffectiveApiToken(apiToken);
}

/**
 * Convert SDK Item (camelCase) to ApiItemListView (snake_case)
 */
function toApiItemListView(item: Item): ApiItemListView {
    return {
        id: item.id || '',
        type: item.type || 'text',
        unlocked: item.unlocked || false,
        decrypt_at: item.decryptAt || 0,
        created_at: item.createdAt,
        metadata: item.metadata as ItemMetadata,
    };
}

/**
 * Convert SDK Item (camelCase) to ApiItemDetail (snake_case)
 */
function toApiItemDetail(item: Item): ApiItemDetail {
    return {
        id: item.id || '',
        type: item.type || 'text',
        unlocked: item.unlocked || false,
        decrypt_at: item.decryptAt || 0,
        content: item.content || null,
        timeRemainingMs: item.timeRemainingMs,
        metadata: item.metadata as ItemMetadata,
        layer_count: item.layerCount,
        original_name: item.originalName,
        created_at: item.createdAt,
    };
}

// ============================================
// API Client Options
// ============================================

export interface ApiClientOptions {
    baseUrl?: string;
    token?: string;
    fetchFn?: typeof fetch;
}

// ============================================
// API Client Class
// ============================================

/**
 * API Client Class using Chaster SDK
 */
export class ChasterApiClient {
    private customBaseUrl?: string;
    private customToken?: string;

    constructor(options: ApiClientOptions = {}) {
        this.customBaseUrl = options.baseUrl;
        this.customToken = options.token;
    }

    /**
     * Configure SDK before each request
     */
    private configure() {
        configureSDK(this.customBaseUrl, this.customToken);
    }

    /**
     * List all items with optional filtering
     */
    async getItems(params?: FilterParams): Promise<ApiItemListView[]> {
        this.configure();

        const response = await ItemsService.getItems1({
            status: params?.status || 'all',
            type: params?.type,
            limit: params?.limit || 50,
            offset: params?.offset,
        });

        const items = response.items || [];
        return items.map(toApiItemListView);
    }

    /**
     * Create a new encrypted item
     */
    async createItem(data: CreateItemRequest): Promise<ApiItemDetail> {
        this.configure();

        const input: ItemInput = {
            type: data.type,
            content: data.content,
            durationMinutes: data.durationMinutes,
            decryptAt: data.decryptAt,
            metadata: data.metadata,
        };

        const item = await ItemsService.postItems({ requestBody: input });
        return toApiItemDetail(item);
    }

    /**
     * Get item details by ID (attempts decryption if unlocked)
     */
    async getItemById(id: string): Promise<ApiItemDetail> {
        this.configure();

        const item = await ItemsService.getItems({ id });
        return toApiItemDetail(item);
    }

    /**
     * Extend the lock duration of an existing item
     */
    async extendItem(id: string, minutes: number): Promise<ApiItemDetail> {
        this.configure();

        const result = await ItemsService.postItemsExtend({
            id,
            requestBody: { minutes },
        });

        // The extend response may be the Item itself or similar structure
        return toApiItemDetail(result);
    }

    /**
     * Delete an item permanently
     * Note: SDK returns void, we convert to legacy format for backward compatibility
     */
    async deleteItem(id: string): Promise<{ success: boolean }> {
        this.configure();

        await ItemsService.deleteItems({ id });
        return { success: true };
    }

    /**
     * Get system statistics
     */
    async getStats(): Promise<SystemStats> {
        this.configure();

        const stats = await SystemService.getStats();

        return {
            totalItems: stats.totalItems || 0,
            lockedItems: stats.lockedItems || 0,
            unlockedItems: stats.unlockedItems || 0,
            byType: {
                text: stats.byType?.text || 0,
                image: stats.byType?.image || 0,
            },
            avgLockDurationMinutes: stats.avgLockDurationMinutes,
        };
    }
}

// ============================================
// Factory & Singleton
// ============================================

/**
 * Factory function to create an API client instance
 */
export function createApiClient(options?: ApiClientOptions): ChasterApiClient {
    return new ChasterApiClient(options);
}

/**
 * Singleton API client instance
 */
export const apiClient = createApiClient();



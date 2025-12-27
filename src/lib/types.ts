/**
 * Type definitions for Chaster application
 * Single source of truth for all shared types
 */

// ============================================
// API Types (used by api-client and API routes)
// ============================================

/**
 * Item list view - used in sidebar and API responses
 */
export interface ItemListView {
    id: string;
    type: 'text' | 'image';
    original_name: string | null;
    decrypt_at: number;
    created_at: number;
    layer_count: number;
    user_id: string;
}

/**
 * Full item detail view - used in content view
 */
export interface ItemDetail extends ItemListView {
    unlocked: boolean;
    content: string | null;
}

/**
 * API list view format (from remote API)
 */
export interface ApiItemListView {
    id: string;
    type: 'text' | 'image';
    unlocked: boolean;
    decryptAt: number;
    createdAt?: number;
    metadata?: Record<string, unknown>;
}

/**
 * API detail format (from remote API)
 */
export interface ApiItemDetail {
    id: string;
    type: 'text' | 'image';
    unlocked: boolean;
    timeRemainingMs?: number;
    decryptAt: number;
    content: string | null;
    metadata?: Record<string, unknown>;
}

/**
 * Request to create a new item
 */
export interface CreateItemRequest {
    type: 'text' | 'image';
    content: string;
    durationMinutes?: number;
    decryptAt?: number;
    metadata?: Record<string, unknown>;
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
    limit?: number;
    offset?: number;
    sort?: 'created_asc' | 'created_desc' | 'decrypt_asc' | 'decrypt_desc';
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

/**
 * Type definitions for Promissum application
 * Single source of truth for all shared types
 *
 * Note: Field names use snake_case to match frontend expectations.
 * The API routes convert internal camelCase responses to snake_case.
 */

// ============================================
// Extended Metadata Types
// ============================================

/**
 * Extended metadata for items
 * Stored in the 'metadata' field of items
 */
export interface ItemMetadata {
    title?: string;        // Custom title for the item
    tags?: string[];       // Tags for categorization
    [key: string]: unknown; // Allow additional custom fields
}

// ============================================
// API Types (used by frontend, API routes, and services)
// ============================================

/**
 * Unified Item type for list and detail views
 */
export interface Item {
    id: string;
    type: 'text' | 'image';
    unlocked: boolean;
    decrypt_at: number;
    created_at: number;
    content?: string | null;
    metadata?: ItemMetadata;
    original_name?: string | null;
}

/**
 * @deprecated Use Item instead
 */
export type ApiItemListView = Item;

/**
 * @deprecated Use Item instead
 */
export type ApiItemDetail = Item;

/**
 * @deprecated Use Item instead
 */
export type ApiItemResponse = Item;

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
 * Filter parameters for listing items
 * CANONICAL DEFINITION - import from @/lib/types
 */
export interface FilterParams {
    status?: 'all' | 'locked' | 'unlocked';
    type?: 'text' | 'image';
    search?: string;
    sort?: 'created_asc' | 'created_desc' | 'decrypt_asc' | 'decrypt_desc';
    limit?: number;
    offset?: number;
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
}


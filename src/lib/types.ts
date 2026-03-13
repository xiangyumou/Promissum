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
 * API list view format (from API routes)
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
 * API detail format (from API routes)
 */
export interface ApiItemDetail {
    id: string;
    type: 'text' | 'image';
    unlocked: boolean;
    timeRemainingMs?: number;
    decrypt_at: number;
    content: string | null;
    metadata?: ItemMetadata;
    original_name?: string | null;
    created_at?: number;
}

/**
 * API Item response format (from local API routes)
 * Uses snake_case for frontend compatibility
 */
export interface ApiItemResponse {
    id: string;
    type: 'text' | 'image';
    decrypt_at: number;
    created_at?: number;
    unlocked: boolean;
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
    metadata?: ItemMetadata;
}

/**
 * Filter parameters for listing items
 * CANONICAL DEFINITION - import from @/lib/types, not from queries.ts
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
}


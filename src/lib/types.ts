/**
 * Type definitions for Chaster application
 * Single source of truth for all shared types
 */

// ============================================
// Extended Metadata Types
// ============================================

/**
 * Extended metadata for items
 * Stored in the 'metadata' field of remote API
 */
export interface ItemMetadata {
    title?: string;        // Custom title for the item
    tags?: string[];       // Tags for categorization
    [key: string]: unknown; // Allow additional custom fields
}

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
    metadata?: ItemMetadata; // Extended metadata
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
    decrypt_at: number;
    created_at?: number;
    metadata?: ItemMetadata;
}

/**
 * API detail format (from remote API)
 */
export interface ApiItemDetail {
    id: string;
    type: 'text' | 'image';
    unlocked: boolean;
    timeRemainingMs?: number;
    decrypt_at: number;
    content: string | null;
    metadata?: ItemMetadata;
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

    // Phase 3: Enhanced filtering
    dateRange?: {
        start: number; // Timestamp in ms
        end: number;   // Timestamp in ms
    };
    quickFilter?: 'unlocking-soon' | 'long-locked' | 'recent';
}

/**
 * Saved filter preset
 */
export interface FilterPreset {
    id: string;
    name: string;
    filters: Omit<FilterParams, 'limit' | 'offset'>;
    createdAt: number;
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

    // Phase 2: Dashboard enhancements
    upcomingUnlocks?: ApiItemListView[]; // Items unlocking within 24 hours
    weeklyTrend?: { date: string; count: number }[]; // Last 7 days creation trend
    monthlyComparison?: { current: number; previous: number }; // This month vs last month
}

export interface ApiActiveSession {
    id: string;
    deviceId: string;
    itemId: string;
    lastActive: string;
}

export interface ApiUserPreferences {
    defaultDurationMinutes?: number;
    privacyMode?: boolean;
    panicUrl?: string;
    themeConfig?: string;
    dateTimeFormat?: string;
    compactMode?: boolean;
    sidebarOpen?: boolean;
    confirmDelete?: boolean;
    confirmExtend?: boolean;
    autoRefreshInterval?: number;
    cacheTTLMinutes?: number;
    autoPrivacyDelayMinutes?: number;
    panicShortcut?: string;
    apiToken?: string;
    apiUrl?: string;
}

// ============================================
// Sharing Types
// ============================================

/**
 * Share permission levels
 */
export type SharePermission = 'view' | 'view-extend' | 'full';

/**
 * Shared item data
 */
export interface ShareData {
    id: string;
    itemId: string;
    shareToken: string;
    permission: SharePermission;
    createdBy: string;
    expiresAt: number | null; // Timestamp in ms
    createdAt: number; // Timestamp in ms
    lastAccessedAt: number | null; // Timestamp in ms
}

/**
 * Request to create a new share
 */
export interface CreateShareRequest {
    itemId: string;
    permission: SharePermission;
    expiresAt?: number; // Optional timestamp in ms
}

/**
 * Request to update a share
 */
export interface UpdateShareRequest {
    permission?: SharePermission;
    expiresAt?: number | null; // null to remove expiration
}

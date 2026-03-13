/**
 * Type definitions for Promissum application
 * Single source of truth for all shared types
 *
 * Note: Field names use snake_case to match frontend expectations.
 * The API routes convert internal camelCase responses to snake_case.
 */

// ============================================
// Content Bundle Types (New Unified Format)
// ============================================

/**
 * File entry in ContentBundle
 */
export interface BundleFile {
    id: string;            // Unique file identifier
    name: string;          // Original filename
    mimeType: string;      // MIME type
    size: number;          // File size in bytes
    data: string;          // Base64 encoded content
}

/**
 * Unified content bundle - supports text + multiple files
 */
export interface ContentBundle {
    version: 1;
    text?: string;         // Optional text content
    files: BundleFile[];   // Array of files
}

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
 * Content type detection result
 */
export type ContentType = 'text' | 'image' | 'video' | 'audio' | 'pdf' | 'archive' | 'file' | 'mixed';

/**
 * Unified Item type for list and detail views
 */
export interface Item {
    id: string;
    unlocked: boolean;
    decrypt_at: number;
    created_at: number;
    content?: ContentBundle | null;  // Decrypted content bundle
    metadata?: ItemMetadata;
    content_summary?: string | null; // Summary/title of content
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
    text?: string;         // Optional text content
    files?: File[];        // Optional array of files
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
}

// ============================================
// Utility Types
// ============================================

/**
 * Detect content type from bundle
 */
export function detectContentType(bundle: ContentBundle): ContentType {
    const hasText = !!bundle.text?.trim();
    const fileCount = bundle.files?.length || 0;

    if (hasText && fileCount > 0) return 'mixed';
    if (hasText) return 'text';
    if (fileCount === 0) return 'file';
    if (fileCount === 1) {
        const file = bundle.files[0];
        if (file.mimeType.startsWith('image/')) return 'image';
        if (file.mimeType.startsWith('video/')) return 'video';
        if (file.mimeType.startsWith('audio/')) return 'audio';
        if (file.mimeType === 'application/pdf') return 'pdf';
        if (['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/x-7z-compressed'].includes(file.mimeType)) {
            return 'archive';
        }
    }
    return 'file';
}

/**
 * Get icon name for content type
 */
export function getContentTypeIcon(type: ContentType): string {
    const icons: Record<ContentType, string> = {
        text: 'FileText',
        image: 'Image',
        video: 'Video',
        audio: 'Music',
        pdf: 'FileText',
        archive: 'Archive',
        file: 'File',
        mixed: 'Layers',
    };
    return icons[type] || 'File';
}

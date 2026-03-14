/**
 * API Validation Schemas
 *
 * Zod schemas for runtime type validation in API routes.
 * Provides type safety and user-friendly error messages.
 *
 * Note: Using Zod v4 API syntax
 */

import { z } from 'zod';

// =============================================================================
// Content Bundle Schemas
// =============================================================================

export const BundleFileSchema = z.object({
    id: z.string(),
    name: z.string(),
    mimeType: z.string(),
    size: z.number().int().nonnegative(),
    fileId: z.string(), // reference to file in storage
    data: z.string().optional(), // base64 data (populated when decrypted)
});

export type BundleFile = z.infer<typeof BundleFileSchema>;

export const ContentBundleSchema = z.object({
    version: z.literal(1),
    text: z.string().optional(),
    files: z.array(BundleFileSchema),
});

export type ContentBundle = z.infer<typeof ContentBundleSchema>;

// =============================================================================
// Metadata Schemas
// =============================================================================

export const ItemMetadataSchema = z.object({
    title: z.string().optional(),
    tags: z.array(z.string()).optional(),
}).passthrough();

export type ItemMetadata = z.infer<typeof ItemMetadataSchema>;

// =============================================================================
// Filter & Query Schemas
// =============================================================================

export const FilterParamsSchema = z.object({
    status: z.enum(['all', 'locked', 'unlocked']).optional(),
    sort: z.enum(['created_asc', 'created_desc', 'decrypt_asc', 'decrypt_desc']).optional(),
    limit: z.number().int().positive().max(1000).optional(),
    offset: z.number().int().nonnegative().optional(),
});

export type FilterParams = z.infer<typeof FilterParamsSchema>;

/**
 * Query schema for listing items (with coercion for URL query params)
 */
export const QuerySchema = z.object({
    status: z.enum(['all', 'locked', 'unlocked']).optional().nullable().default('all'),
    limit: z.coerce.number().int().positive().max(1000).optional().default(50),
    offset: z.coerce.number().int().nonnegative().optional().default(0),
    sort: z.enum(['created_asc', 'created_desc', 'decrypt_asc', 'decrypt_desc']).optional().default('created_desc'),
});

export type QueryInput = z.infer<typeof QuerySchema>;

// =============================================================================
// Item CRUD Schemas
// =============================================================================

/**
 * Create item request schema
 * Note: Content is validated at runtime from FormData, not JSON body
 */
export const CreateItemSchema = z.object({
    durationMinutes: z.number().int().positive().optional(),
    decryptAt: z.number().int().positive().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
}).check((ctx) => {
    if (ctx.value.durationMinutes === undefined && ctx.value.decryptAt === undefined) {
        ctx.issues.push({
            code: 'custom',
            message: 'Either durationMinutes or decryptAt must be provided',
            path: [],
            input: ctx.value,
        });
    }
});

export type CreateItemInput = z.infer<typeof CreateItemSchema>;

/**
 * Item ID parameter schema
 */
export const ItemIdSchema = z.string().min(1, 'Item ID is required');

// =============================================================================
// Item Schema
// =============================================================================

export const ItemSchema = z.object({
    id: z.string(),
    unlocked: z.boolean(),
    decrypt_at: z.number(),
    created_at: z.number(),
    content: z.union([ContentBundleSchema, z.null()]).optional(),
    metadata: ItemMetadataSchema.optional(),
    content_summary: z.union([z.string(), z.null()]).optional(),
});

export type Item = z.infer<typeof ItemSchema>;

// =============================================================================
// System Stats Schema
// =============================================================================

export const SystemStatsSchema = z.object({
    totalItems: z.number().int(),
    lockedItems: z.number().int(),
    unlockedItems: z.number().int(),
});

export type SystemStats = z.infer<typeof SystemStatsSchema>;

// =============================================================================
// Utility Types
// =============================================================================

/** Content type for display */
export type ContentType = 'text' | 'image' | 'video' | 'audio' | 'pdf' | 'archive' | 'file' | 'mixed';

// =============================================================================
// Content Type Utilities
// =============================================================================

/**
 * Detect content type from bundle
 */
export function detectContentType(bundle: ContentBundle): ContentType {
    const hasText = !!bundle.text?.trim();
    const fileCount = bundle.files?.length || 0;

    if (hasText && fileCount > 0) return 'mixed';
    if (hasText) return 'text';
    if (fileCount === 0) return 'text'; // Fixed: empty defaults to text
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
        video: 'Film',
        audio: 'Music',
        pdf: 'FileText',
        archive: 'Archive',
        file: 'File',
        mixed: 'Layers',
    };
    return icons[type] || 'File';
}

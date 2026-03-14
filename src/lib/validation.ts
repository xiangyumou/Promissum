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
    data: z.string(), // base64 encoded
});

export const ContentBundleSchema = z.object({
    version: z.literal(1),
    text: z.string().optional(),
    files: z.array(BundleFileSchema),
});

// =============================================================================
// Filter & Query Schemas
// =============================================================================

/**
 * Query schema for listing items (with coercion for URL query params)
 */
export const QuerySchema = z.object({
    status: z.enum(['all', 'locked', 'unlocked']).optional().nullable().default('all'),
    search: z.string().optional(),
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
// Response Types
// =============================================================================

/**
 * File info for responses (without binary data)
 */
export interface FileInfo {
    id: string;
    name: string;
    mimeType: string;
    size: number;
}

/**
 * Content bundle response (without binary data)
 */
export interface ContentBundleResponse {
    version: 1;
    text?: string;
    files: FileInfo[];
}

/**
 * Item response type (used in API routes)
 */
export interface ItemResponse {
    id: string;
    unlocked: boolean;
    decryptAt: number;
    createdAt: number;
    metadata: Record<string, unknown> | null;
    content?: ContentBundleResponse | null;
    timeRemainingMs?: number;
    contentSummary?: string | null;
}

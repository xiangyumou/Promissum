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
// Item Types
// =============================================================================

export const ItemTypeSchema = z.enum(['text', 'image']);
export type ItemType = z.infer<typeof ItemTypeSchema>;

// =============================================================================
// Filter & Query Schemas
// =============================================================================

/**
 * Filter parameters for listing items
 */
export const FilterParamsSchema = z.object({
    status: z.enum(['all', 'locked', 'unlocked']).optional(),
    type: z.enum(['text', 'image']).optional(),
    sort: z.enum(['created_asc', 'created_desc', 'decrypt_asc', 'decrypt_desc']).optional(),
    limit: z.coerce.number().positive().optional(),
    offset: z.coerce.number().nonnegative().optional(),
});

export type FilterParamsInput = z.infer<typeof FilterParamsSchema>;

/**
 * Query schema for service layer
 */
export const QuerySchema = z.object({
    status: z.enum(['all', 'locked', 'unlocked']).optional().nullable().default('all'),
    type: z.enum(['text', 'image']).optional().nullable(),
    search: z.string().optional(),
    limit: z.number().int().positive().max(1000).optional().default(50),
    offset: z.number().int().nonnegative().optional().default(0),
    sort: z.enum(['created_asc', 'created_desc', 'decrypt_asc', 'decrypt_desc']).optional().default('created_desc'),
});

export type QueryInput = z.infer<typeof QuerySchema>;

/**
 * API query schema (with coercion for query params)
 */
export const ApiQuerySchema = z.object({
    status: z.enum(['all', 'locked', 'unlocked']).optional().nullable(),
    type: z.enum(['text', 'image']).optional().nullable(),
    search: z.string().optional(),
    limit: z.coerce.number().int().positive().max(1000).optional().default(50),
    offset: z.coerce.number().int().nonnegative().optional().default(0),
    sort: z.enum(['created_asc', 'created_desc', 'decrypt_asc', 'decrypt_desc']).optional().default('created_desc'),
});

export type ApiQueryInput = z.infer<typeof ApiQuerySchema>;

// =============================================================================
// Item CRUD Schemas
// =============================================================================

/**
 * Create item request schema
 */
export const CreateItemSchema = z.object({
    type: ItemTypeSchema,
    content: z.string().min(1, 'Content is required'),
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
 * Extend item request schema
 */
export const ExtendItemSchema = z.object({
    minutes: z.number().int().positive('Minutes must be a positive number'),
});

export type ExtendItemInput = z.infer<typeof ExtendItemSchema>;

/**
 * Item ID parameter schema
 */
export const ItemIdSchema = z.string().min(1, 'Item ID is required');

// =============================================================================
// Response Types
// =============================================================================

/**
 * Item response type (used in service layer)
 */
export interface ItemResponse {
    id: string;
    type: string;
    originalName: string | null;
    decryptAt: number;
    createdAt: number;
    layerCount: number;
    unlocked: boolean;
    metadata: Record<string, unknown> | null;
    content?: string | null;
    timeRemainingMs?: number;
}

/**
 * Parse form data into a structured object for validation
 */
export function parseFormDataToObject(formData: FormData): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    formData.forEach((value, key) => {
        if (typeof value === 'string') {
            // Try to parse JSON for metadata
            if (key === 'metadata') {
                try {
                    result[key] = JSON.parse(value);
                } catch {
                    result[key] = value;
                }
            }
            // Parse numbers
            else if (key === 'durationMinutes' || key === 'decryptAt') {
                const num = parseInt(value, 10);
                if (!isNaN(num)) {
                    result[key] = num;
                }
            }
            else {
                result[key] = value;
            }
        } else {
            // File objects stay as-is
            result[key] = value;
        }
    });

    return result;
}

/**
 * Format Zod errors into user-friendly messages
 */
export function formatZodErrors(error: z.ZodError<unknown>): string {
    return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
}

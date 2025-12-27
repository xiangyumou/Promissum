/**
 * API Validation Schemas
 * 
 * Zod schemas for runtime type validation in API routes.
 * Provides type safety and user-friendly error messages.
 * 
 * Note: Using Zod v4 API syntax
 */

import { z } from 'zod';

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
 * Create item request schema
 */
export const CreateItemSchema = z.object({
    type: z.enum(['text', 'image']),
    content: z.string().min(1, 'Content is required'),
    durationMinutes: z.number().positive().optional(),
    decryptAt: z.number().positive().optional(),
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
    minutes: z.number().positive('Minutes must be a positive number'),
});

export type ExtendItemInput = z.infer<typeof ExtendItemSchema>;

/**
 * Item ID parameter schema
 */
export const ItemIdSchema = z.string().min(1, 'Item ID is required');

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

import { z } from 'zod';

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

export const createItemSchema = z.object({
    type: z.enum(['text', 'image']),
    content: z.string().min(1, "Content cannot be empty"),
    durationMinutes: z.number().int().positive("Duration must be positive").optional(),
    decryptAt: z.number().int().positive("Decrypt time must be positive").optional(),
    metadata: z.record(z.string(), z.any()).optional(),
}).superRefine((data, ctx) => {
    if (data.durationMinutes === undefined && data.decryptAt === undefined) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Either durationMinutes or decryptAt must be provided',
            path: ['durationMinutes']
        });
    }
});

export const apiQuerySchema = z.object({
    status: z.enum(['all', 'locked', 'unlocked']).optional().nullable(),
    type: z.enum(['text', 'image']).optional().nullable(),
    limit: z.coerce.number().int().positive().max(1000).optional().default(50),
    offset: z.coerce.number().int().nonnegative().optional().default(0),
    sort: z.enum(['created_asc', 'created_desc', 'decrypt_asc', 'decrypt_desc']).optional().default('created_desc'),
});

export const querySchema = z.object({
    status: z.enum(['locked', 'unlocked', 'all']).optional().default('all'),
    type: z.enum(['text', 'image']).optional(),
    limit: z.number().int().positive().max(1000).optional().default(50),
    offset: z.number().int().nonnegative().optional().default(0),
    sort: z.enum(['created_asc', 'created_desc', 'decrypt_asc', 'decrypt_desc']).optional().default('created_desc'),
});

export const extendSchema = z.object({
    minutes: z.number().int().positive("Minutes must be positive"),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type GetItemsParams = z.infer<typeof querySchema>;
export type GetItemsInput = z.input<typeof querySchema>;

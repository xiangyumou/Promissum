import { NextRequest, NextResponse } from 'next/server';
import { createItem, getItems } from '@/lib/services/items/item-service';
import { withRateLimit } from '@/lib/services/rate-limiting/wrapper';
import { toSnakeCase } from '@/lib/utils';
import { DEFAULT_LOCK_DURATION_MINUTES } from '@/lib/constants';
import { DrandError } from '@/lib/services/encryption/tlock';
import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Zod schemas for validation
const querySchema = z.object({
    status: z.enum(['all', 'locked', 'unlocked']).nullable().optional(),
    type: z.enum(['text', 'image']).nullable().optional(),
    sort: z.enum(['created_asc', 'created_desc', 'decrypt_asc', 'decrypt_desc']).nullable().optional()
});

async function getHandler(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        
        const parseResult = querySchema.safeParse({
            status: searchParams.get('status') || null,
            type: searchParams.get('type') || null,
            sort: searchParams.get('sort') || null
        });

        if (!parseResult.success) {
            return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
        }

        const { status, type, sort } = parseResult.data;

        const result = await getItems({
            status: (status || undefined) as any,
            type: (type || undefined) as any,
            sort: (sort || 'created_desc') as any,
            limit: 50, // Default limit
            offset: 0,
        });

        const mappedItems = result.items.map(item => toSnakeCase({
            id: item.id,
            type: item.type,
            decryptAt: item.decryptAt,
            createdAt: item.createdAt,
            unlocked: item.unlocked,
            metadata: item.metadata,
        }));

        return NextResponse.json({
            items: mappedItems,
            lastDuration: DEFAULT_LOCK_DURATION_MINUTES
        });
    } catch (error) {
        console.error('Error fetching items:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json({
            items: [],
            lastDuration: DEFAULT_LOCK_DURATION_MINUTES,
            error: 'Failed to fetch items',
        }, { status: 500 });
    }
}

async function postHandler(request: NextRequest) {
    try {
        const formData = await request.formData();
        
        // Basic Type Validation
        const type = formData.get('type');
        if (type !== 'text' && type !== 'image') {
            return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
        }

        const durationStr = formData.get('durationMinutes');
        const decryptAtStr = formData.get('decryptAt');
        
        // Time validation logic
        const durationMinutes = durationStr ? parseInt(durationStr as string, 10) : null;
        const decryptAtTimestamp = decryptAtStr ? parseInt(decryptAtStr as string, 10) : null;

        if (!durationMinutes && !decryptAtTimestamp) {
            return NextResponse.json({ error: 'Must provide either durationMinutes or decryptAt' }, { status: 400 });
        }

        if (durationMinutes && (isNaN(durationMinutes) || durationMinutes <= 0)) {
            return NextResponse.json({ error: 'Invalid durationMinutes' }, { status: 400 });
        }
        
        if (decryptAtTimestamp && (isNaN(decryptAtTimestamp) || decryptAtTimestamp <= Date.now())) {
             return NextResponse.json({ error: 'Invalid decryptAt timestamp' }, { status: 400 });
        }

        // Metadata Parsing
        const metadataString = formData.get('metadata') as string;
        let metadata: Record<string, unknown> | undefined;
        if (metadataString) {
            try {
                metadata = JSON.parse(metadataString);
            } catch (_) {
                return NextResponse.json({ error: 'Invalid metadata JSON' }, { status: 400 });
            }
        }

        let content: string;

        if (type === 'text') {
            const text = formData.get('content');
            if (!text || typeof text !== 'string') {
                return NextResponse.json({ error: 'Missing text content' }, { status: 400 });
            }
            if (text.length > MAX_FILE_SIZE) { // Reuse size limit for text too (approx 10MB text)
                 return NextResponse.json({ error: 'Text content too large' }, { status: 413 });
            }
            content = text;
        } else {
            const file = formData.get('file');
            if (!file || !(file instanceof File)) {
                return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
            }
            
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });
            }

            if (!ALLOWED_MIME_TYPES.includes(file.type)) {
                return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WEBP' }, { status: 415 });
            }

            const arrayBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            content = base64;
        }

        const item = await createItem({
            type,
            content,
            durationMinutes: durationMinutes || undefined,
            decryptAt: decryptAtTimestamp || undefined,
            metadata,
        });

        return NextResponse.json({
            success: true,
            item: toSnakeCase({
                id: item.id,
                type: item.type,
                decryptAt: item.decryptAt,
                unlocked: item.unlocked,
                metadata: item.metadata,
            })
        });
    } catch (error) {
        console.error('Error creating item:', error instanceof Error ? error.message : 'Unknown error');
        
        if (error instanceof DrandError) {
            return NextResponse.json({
                error: 'Encryption Service Unavailable',
                code: error.code
            }, { status: 502 }); // Bad Gateway for upstream drand issues
        }

        return NextResponse.json({
            error: 'Failed to create item',
            message: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
        }, { status: 500 });
    }
}

export const GET = withRateLimit(getHandler);
export const POST = withRateLimit(postHandler);

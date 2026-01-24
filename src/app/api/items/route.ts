import { NextRequest, NextResponse } from 'next/server';
import { createItem, getItems } from '@/lib/services/items/item-service';
import { withRateLimit } from '@/lib/services/rate-limiting/wrapper';
import { toSnakeCase } from '@/lib/utils';
import { DEFAULT_LOCK_DURATION_MINUTES } from '@/lib/constants';
import { apiQuerySchema, createItemSchema } from '@/lib/services/items/item-validation';
import { withApiHandler, successResponse, validateSearchParams } from '@/lib/api-utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

async function getHandler(request: NextRequest) {
    const query = validateSearchParams(request.url, apiQuerySchema);

    const result = await getItems({
        status: (query.status || undefined),
        type: (query.type || undefined),
        search: (query.search || undefined),
        sort: query.sort,
        limit: query.limit,
        offset: query.offset,
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
        lastDuration: DEFAULT_LOCK_DURATION_MINUTES,
        total: result.total
    });
}

async function postHandler(request: NextRequest) {
    const formData = await request.formData();
    const rawData: Record<string, unknown> = {};
    
    const type = formData.get('type');
    if (type) rawData.type = type;
    
    const durationStr = formData.get('durationMinutes');
    if (durationStr) rawData.durationMinutes = Number(durationStr);
    
    const decryptAtStr = formData.get('decryptAt');
    if (decryptAtStr) rawData.decryptAt = Number(decryptAtStr);
    
    const metadataString = formData.get('metadata') as string;
    if (metadataString) {
        try {
            rawData.metadata = JSON.parse(metadataString);
        } catch {
            throw new Error('Invalid metadata JSON');
        }
    }

    if (type === 'text') {
        const text = formData.get('content');
        if (typeof text === 'string') {
            if (text.length > MAX_FILE_SIZE) {
                throw new Error('Text content too large');
            }
            rawData.content = text;
        }
    } else if (type === 'image') {
        const file = formData.get('file');
        if (file instanceof File) {
             if (file.size > MAX_FILE_SIZE) {
                throw new Error('File too large (max 10MB)');
            }
            if (!ALLOWED_MIME_TYPES.includes(file.type)) {
                throw new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WEBP');
            }
            const arrayBuffer = await file.arrayBuffer();
            rawData.content = Buffer.from(arrayBuffer).toString('base64');
        }
    }

    // Validate the constructed object against the Zod schema
    // This ensures that even if createItem is mocked in tests, we catch invalid inputs here
    const validatedInput = createItemSchema.parse(rawData);

    const item = await createItem(validatedInput);

    return successResponse({
        item: {
            id: item.id,
            type: item.type,
            decryptAt: item.decryptAt,
            unlocked: item.unlocked,
            metadata: item.metadata,
        },
        success: true
    }, 201);
}

export const GET = withRateLimit((req) => withApiHandler(() => getHandler(req)));
export const POST = withRateLimit((req) => withApiHandler(() => postHandler(req)));

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { items } from '@/lib/db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { encrypt } from '@/lib/services/encryption/tlock';
import { ApiQuerySchema, CreateItemSchema } from '@/lib/validation';
import { withApiHandler, successResponse, validateSearchParams } from '@/lib/api-utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Helper to format item response
function formatItemResponse(item: {
    id: string;
    type: string;
    decryptAt: Date;
    createdAt: Date;
    metadata: string | null;
}) {
    const now = Date.now();
    const decryptAtMs = item.decryptAt.getTime();
    const unlocked = decryptAtMs <= now;

    return {
        id: item.id,
        type: item.type,
        decrypt_at: decryptAtMs,
        created_at: item.createdAt.getTime(),
        unlocked,
        metadata: item.metadata ? JSON.parse(item.metadata) as Record<string, unknown> : null,
    };
}

async function getHandler(request: NextRequest) {
    const query = validateSearchParams(request.url, ApiQuerySchema);

    // Build where conditions
    const conditions = [];
    if (query.type) {
        conditions.push(eq(items.type, query.type));
    }
    if (query.status === 'locked') {
        conditions.push(sql`${items.decryptAt} >= ${new Date()}`);
    } else if (query.status === 'unlocked') {
        conditions.push(sql`${items.decryptAt} <= ${new Date()}`);
    }

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(items);
    if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions)) as typeof countQuery;
    }
    const countResult = await countQuery;
    const total = countResult[0]?.count || 0;

    // Build order by
    let orderByClause;
    if (query.sort?.startsWith('created')) {
        orderByClause = query.sort === 'created_asc' ? asc(items.createdAt) : desc(items.createdAt);
    } else {
        orderByClause = query.sort === 'decrypt_asc' ? asc(items.decryptAt) : desc(items.decryptAt);
    }

    // Get paginated results
    const dbItems = await db.select({
        id: items.id,
        type: items.type,
        decryptAt: items.decryptAt,
        createdAt: items.createdAt,
        metadata: items.metadata,
    }).from(items)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderByClause || desc(items.createdAt))
        .limit(query.limit || 50)
        .offset(query.offset || 0);

    const mappedItems = dbItems.map(item => formatItemResponse({
        id: item.id!,
        type: item.type!,
        decryptAt: item.decryptAt!,
        createdAt: item.createdAt!,
        metadata: item.metadata ?? null,
    }));

    return NextResponse.json({
        items: mappedItems,
        total
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

    let dataToEncrypt: Buffer;

    if (type === 'text') {
        const text = formData.get('content');
        if (typeof text === 'string') {
            if (text.length > MAX_FILE_SIZE) {
                throw new Error('Text content too large');
            }
            rawData.content = text;
            dataToEncrypt = Buffer.from(text, 'utf-8');
        } else {
            throw new Error('Content is required');
        }
    } else if (type === 'image') {
        const file = formData.get('file');
        const imageContent = formData.get('content');

        if (file instanceof File) {
            if (file.size > MAX_FILE_SIZE) {
                throw new Error('File too large (max 10MB)');
            }
            if (!ALLOWED_MIME_TYPES.includes(file.type)) {
                throw new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WEBP');
            }
            const arrayBuffer = await file.arrayBuffer();
            dataToEncrypt = Buffer.from(arrayBuffer);
            rawData.content = dataToEncrypt.toString('base64');
        } else if (typeof imageContent === 'string' && imageContent.length > 0) {
            dataToEncrypt = Buffer.from(imageContent, 'base64');
            rawData.content = imageContent;
        } else {
            throw new Error('Image content is required');
        }
    } else {
        throw new Error('Invalid type');
    }

    // Validate the constructed object
    const validated = CreateItemSchema.parse(rawData);

    // Calculate decryptAt
    let decryptAt: Date;
    if (validated.decryptAt) {
        decryptAt = new Date(validated.decryptAt);
        if (isNaN(decryptAt.getTime()) || decryptAt.getTime() <= Date.now()) {
            throw new Error('decryptAt must be in the future');
        }
    } else {
        decryptAt = new Date(Date.now() + validated.durationMinutes! * 60 * 1000);
    }

    // Encrypt data
    const { ciphertext, roundNumber } = await encrypt(dataToEncrypt, decryptAt);

    // Save to database
    const [item] = await db.insert(items).values({
        id: crypto.randomUUID(),
        type: validated.type,
        encryptedData: ciphertext,
        originalName: validated.type === 'image' ? 'image.png' : null,
        decryptAt,
        roundNumber,
        metadata: JSON.stringify(validated.metadata ?? {}),
    }).returning();

    return successResponse({
        item: {
            id: item.id,
            type: item.type,
            decryptAt: item.decryptAt!.getTime(),
            unlocked: false,
            metadata: validated.metadata ?? null,
        },
        success: true
    }, 201);
}

export const GET = (req: NextRequest) => withApiHandler(() => getHandler(req));
export const POST = (req: NextRequest) => withApiHandler(() => postHandler(req));

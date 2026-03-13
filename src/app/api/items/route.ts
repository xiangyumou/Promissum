import { NextRequest, NextResponse } from 'next/server';
import { listItems, createItem } from '@/core/db';
import { encrypt } from '@/core/crypto';
import { ApiQuerySchema, CreateItemSchema } from '@/lib/validation';
import { withApiHandler, successResponse, validateSearchParams } from '@/lib/api-utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

async function getHandler(request: NextRequest) {
    const query = validateSearchParams(request.url, ApiQuerySchema);
    const result = await listItems({
        ...query,
        status: query.status ?? undefined,
        type: query.type ?? undefined,
    });
    return NextResponse.json(result);
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
            dataToEncrypt = Buffer.from(text, 'utf-8');
            rawData.content = text;
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

    const validated = CreateItemSchema.parse(rawData);

    let decryptAt: Date;
    if (validated.decryptAt) {
        decryptAt = new Date(validated.decryptAt);
        if (isNaN(decryptAt.getTime()) || decryptAt.getTime() <= Date.now()) {
            throw new Error('decryptAt must be in the future');
        }
    } else {
        decryptAt = new Date(Date.now() + validated.durationMinutes! * 60 * 1000);
    }

    const { ciphertext, roundNumber } = await encrypt(dataToEncrypt, decryptAt);

    const item = await createItem({
        type: validated.type,
        encryptedData: ciphertext,
        originalName: validated.type === 'image' ? 'image.png' : null,
        decryptAt,
        roundNumber,
        metadata: validated.metadata,
    });

    return successResponse({ item, success: true }, 201);
}

export const GET = (req: NextRequest) => withApiHandler(() => getHandler(req));
export const POST = (req: NextRequest) => withApiHandler(() => postHandler(req));

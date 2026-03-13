import { NextRequest, NextResponse } from 'next/server';
import { listItems, createItem } from '@/core/db';
import { encrypt } from '@/core/crypto';
import { ApiQuerySchema, CreateItemSchema } from '@/lib/validation';
import { withApiHandler, successResponse, validateSearchParams } from '@/lib/api-utils';
import type { ContentBundle } from '@/lib/types';

const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total limit

async function getHandler(request: NextRequest) {
    const query = validateSearchParams(request.url, ApiQuerySchema);
    const result = await listItems({
        ...query,
        status: query.status ?? undefined,
    });
    return NextResponse.json(result);
}

async function postHandler(request: NextRequest) {
    const formData = await request.formData();
    const rawData: Record<string, unknown> = {};

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

    // Build ContentBundle from form data
    const bundle: ContentBundle = {
        version: 1,
        files: [],
    };

    // Extract text content
    const text = formData.get('text');
    if (typeof text === 'string' && text.trim()) {
        bundle.text = text.trim();
    }

    // Extract files (support multiple files via 'files' field or single 'file')
    const files: File[] = [];
    const fileEntries = formData.getAll('files');
    const singleFile = formData.get('file');

    for (const entry of fileEntries) {
        if (entry instanceof File) {
            files.push(entry);
        }
    }
    if (singleFile instanceof File) {
        files.push(singleFile);
    }

    // Process files into bundle
    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        bundle.files.push({
            id: crypto.randomUUID(),
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            data: base64Data,
        });
    }

    // Validate: must have at least text or one file
    if (!bundle.text && bundle.files.length === 0) {
        throw new Error('Content is required: provide text or at least one file');
    }

    // Calculate total size
    let totalSize = 0;
    if (bundle.text) {
        totalSize += Buffer.byteLength(bundle.text, 'utf-8');
    }
    for (const file of bundle.files) {
        totalSize += file.size;
    }

    if (totalSize > MAX_TOTAL_SIZE) {
        throw new Error(`Total content too large (max ${MAX_TOTAL_SIZE / 1024 / 1024}MB)`);
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

    // Convert bundle to buffer and encrypt
    const bundleJson = JSON.stringify(bundle);
    const dataToEncrypt = Buffer.from(bundleJson, 'utf-8');
    const { ciphertext, roundNumber } = await encrypt(dataToEncrypt, decryptAt);

    // Generate content summary for display
    let contentSummary: string | null = null;
    if (bundle.text) {
        contentSummary = bundle.text.slice(0, 100);
    } else if (bundle.files.length > 0) {
        const fileNames = bundle.files.map(f => f.name).join(', ');
        contentSummary = fileNames.slice(0, 100);
    }

    const item = await createItem({
        encryptedData: ciphertext,
        contentSummary,
        decryptAt,
        roundNumber,
        metadata: validated.metadata,
    });

    return successResponse({ item, success: true }, 201);
}

export const GET = (req: NextRequest) => withApiHandler(() => getHandler(req));
export const POST = (req: NextRequest) => withApiHandler(() => postHandler(req));

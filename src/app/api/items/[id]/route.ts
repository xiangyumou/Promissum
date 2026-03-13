import { NextRequest } from 'next/server';
import { db } from '@/lib/db/client';
import { items } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/lib/services/encryption/tlock';
import { withApiHandler, successResponse } from '@/lib/api-utils';

// Helper to format item response
function formatItemResponse(item: {
    id: string;
    type: string;
    originalName: string | null;
    decryptAt: Date;
    createdAt: Date;
    metadata: string | null;
    encryptedData?: string;
    content?: string | null;
}) {
    const now = Date.now();
    const decryptAtMs = item.decryptAt.getTime();
    const unlocked = decryptAtMs <= now;

    return {
        id: item.id,
        type: item.type,
        original_name: item.originalName,
        decrypt_at: decryptAtMs,
        created_at: item.createdAt.getTime(),
        unlocked,
        metadata: item.metadata ? JSON.parse(item.metadata) as Record<string, unknown> : null,
        time_remaining_ms: unlocked ? undefined : decryptAtMs - now,
        content: item.content ?? null,
    };
}

async function getHandler(_request: NextRequest, context: unknown) {
    const { id } = await (context as { params: Promise<{ id: string }> }).params;

    // Get item header (without encrypted data for security)
    const [itemHeader] = await db.select({
        id: items.id,
        type: items.type,
        originalName: items.originalName,
        decryptAt: items.decryptAt,
        createdAt: items.createdAt,
        metadata: items.metadata,
    }).from(items).where(eq(items.id, id)).limit(1);

    if (!itemHeader) {
        throw new Error('Item not found');
    }

    const now = Date.now();
    const unlocked = itemHeader.decryptAt!.getTime() <= now;

    const response: Record<string, unknown> = formatItemResponse({
        id: itemHeader.id!,
        type: itemHeader.type!,
        originalName: itemHeader.originalName ?? null,
        decryptAt: itemHeader.decryptAt!,
        createdAt: itemHeader.createdAt!,
        metadata: itemHeader.metadata ?? null,
    });

    // If unlocked, fetch and decrypt content
    if (unlocked) {
        const [itemSecret] = await db.select({
            encryptedData: items.encryptedData,
        }).from(items).where(eq(items.id, id)).limit(1);

        if (itemSecret?.encryptedData) {
            try {
                const decryptedBuffer = await decrypt(itemSecret.encryptedData);

                if (decryptedBuffer) {
                    if (itemHeader.type === 'text') {
                        response.content = decryptedBuffer.toString('utf-8');
                    } else {
                        const base64Content = decryptedBuffer.toString('base64');
                        response.content = `data:image/png;base64,${base64Content}`;
                    }
                } else {
                    // Decryption returned null - time may not be reached yet
                    response.content = null;
                }
            } catch (error) {
                console.error('Failed to decrypt item:', id, error);
                throw new Error('Failed to decrypt content');
            }
        }
    }

    return successResponse(response);
}

async function deleteHandler(_request: NextRequest, context: unknown) {
    const { id } = await (context as { params: Promise<{ id: string }> }).params;

    const result = await db.delete(items).where(eq(items.id, id));

    if (result.changes === 0) {
        throw new Error('Item not found');
    }

    return successResponse({ success: true });
}

export const GET = (req: NextRequest, ctx: unknown) => withApiHandler(() => getHandler(req, ctx));
export const DELETE = (req: NextRequest, ctx: unknown) => withApiHandler(() => deleteHandler(req, ctx));

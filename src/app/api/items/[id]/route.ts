import { NextRequest } from 'next/server';
import { getItemById, deleteItem } from '@/lib/services/items/item-service';
import { withRateLimit } from '@/lib/services/rate-limiting/wrapper';
import { withApiHandler, successResponse } from '@/lib/api-utils';

async function getHandler(_request: NextRequest, context: unknown) {
    const { id } = await (context as { params: Promise<{ id: string }> }).params;

    const item = await getItemById(id);

    return successResponse({
        id: item.id,
        type: item.type,
        decryptAt: item.decryptAt,
        createdAt: item.createdAt,
        unlocked: item.unlocked,
        content: item.content,
        metadata: item.metadata,
        timeRemainingMs: item.timeRemainingMs,
        layerCount: item.layerCount,
        originalName: item.originalName,
    });
}

async function deleteHandler(_request: NextRequest, context: unknown) {
    const { id } = await (context as { params: Promise<{ id: string }> }).params;

    await deleteItem(id);

    return successResponse({ success: true });
}

export const GET = withRateLimit((req, ctx) => withApiHandler(() => getHandler(req, ctx)));
export const DELETE = withRateLimit((req, ctx) => withApiHandler(() => deleteHandler(req, ctx)));

import { NextRequest, NextResponse } from 'next/server';
import { getItemById, deleteItem } from '@/lib/services/items/item-service';
import { withRateLimit } from '@/lib/services/rate-limiting/wrapper';
import { toSnakeCase } from '@/lib/utils';

async function getHandler(_request: NextRequest, context: unknown) {
    try {
        const { id } = await (context as { params: Promise<{ id: string }> }).params;

        const item = await getItemById(id);

        const response = toSnakeCase({
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
        }) as Record<string, unknown>;

        if (item.type === 'image' && item.content) {
            if (!item.content.startsWith('data:image')) {
                response.content = `data:image/png;base64,${item.content}`;
            }
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching item:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch item';

        if (message === 'Item not found') {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}

async function deleteHandler(_request: NextRequest, context: unknown) {
    try {
        const { id } = await (context as { params: Promise<{ id: string }> }).params;

        await deleteItem(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting item:', error);
        const message = error instanceof Error ? error.message : 'Failed to delete item';

        if (message === 'Item not found') {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export const GET = withRateLimit(getHandler);
export const DELETE = withRateLimit(deleteHandler);

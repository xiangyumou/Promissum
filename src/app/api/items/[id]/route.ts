import { NextRequest, NextResponse } from 'next/server';
import { getItemById, deleteItem } from '@/lib/services/items/item-service';
import { withRateLimit } from '@/lib/services/rate-limiting/wrapper';

// GET /api/items/[id] - Get item with decryption attempt
async function getHandler(request: NextRequest, context?: unknown) {
    try {
        // Type assertion for Next.js 16 dynamic route params
        const params = context as { params: Promise<{ id: string }> };
        const { id } = await params.params;

        // Direct service function call - no HTTP!
        const item = await getItemById(id);

        // Transform to snake_case for frontend
        const response: Record<string, unknown> = {
            id: item.id,
            type: item.type,
            decrypt_at: item.decryptAt,
            created_at: item.createdAt,
            unlocked: item.unlocked,
            content: item.content,
            metadata: item.metadata,
            time_remaining_ms: item.timeRemainingMs,
            layer_count: item.layerCount,
            original_name: item.originalName,
        };

        // For images, ensure proper data URL format
        if (item.type === 'image' && item.content) {
            // Check if already has data URL prefix
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

// DELETE /api/items/[id] - Delete item
async function deleteHandler(request: NextRequest, context?: unknown) {
    try {
        // Type assertion for Next.js 16 dynamic route params
        const params = context as { params: Promise<{ id: string }> };
        const { id } = await params.params;

        // Direct service function call - no HTTP!
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

// Apply rate limiting
export const GET = withRateLimit(getHandler);
export const DELETE = withRateLimit(deleteHandler);

import { NextRequest, NextResponse } from 'next/server';
import { extendItem } from '@/lib/services/items/item-service';
import { withRateLimit } from '@/lib/services/rate-limiting/wrapper';
import { formatZodErrors, ExtendItemSchema } from '@/lib/validation';

// POST /api/items/[id]/extend - Extend item lock duration
async function postHandler(request: NextRequest, context?: unknown) {
    try {
        // Type assertion for Next.js 16 dynamic route params
        const params = context as { params: Promise<{ id: string }> };
        const { id } = await params.params;

        const body = await request.json();

        // Validate input with Zod
        const validation = ExtendItemSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: formatZodErrors(validation.error)
            }, { status: 400 });
        }

        const { minutes } = validation.data;

        // Direct service function call - no HTTP!
        const result = await extendItem(id, minutes);

        return NextResponse.json({
            success: true,
            decrypt_at: result.decryptAt,
            layer_count: result.layerCount,
        });
    } catch (error) {
        console.error('Error extending lock:', error);
        const message = error instanceof Error ? error.message : 'Failed to extend lock';

        if (message === 'Item not found') {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (message.includes('retry')) {
            return NextResponse.json({
                error: 'Concurrent modification detected. Please refresh and try again.'
            }, { status: 409 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// Apply rate limiting
export const POST = withRateLimit(postHandler);

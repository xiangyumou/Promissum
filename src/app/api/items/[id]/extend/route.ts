import { NextRequest, NextResponse } from 'next/server';
import { extendItem } from '@/lib/services/items/item-service';
import { withRateLimit } from '@/lib/services/rate-limiting/wrapper';
import { formatZodErrors, ExtendItemSchema } from '@/lib/validation';
import { toSnakeCase } from '@/lib/utils';

async function postHandler(request: NextRequest, context?: unknown) {
    try {
        const params = context as { params: Promise<{ id: string }> };
        const { id } = await params.params;

        const body = await request.json();

        const validation = ExtendItemSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: formatZodErrors(validation.error)
            }, { status: 400 });
        }

        const { minutes } = validation.data;

        const result = await extendItem(id, minutes);

        return NextResponse.json(toSnakeCase({
            success: true,
            decryptAt: result.decryptAt,
            layerCount: result.layerCount,
        }));
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

export const POST = withRateLimit(postHandler);

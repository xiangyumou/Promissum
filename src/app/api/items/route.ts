import { NextRequest, NextResponse } from 'next/server';
import { createItem, getItems } from '@/lib/services/items/item-service';
import { withRateLimit } from '@/lib/services/rate-limiting/wrapper';
import { toSnakeCase } from '@/lib/utils';
import { DEFAULT_LOCK_DURATION_MINUTES } from '@/lib/constants';

async function getHandler(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as 'all' | 'locked' | 'unlocked' | null;
        const type = searchParams.get('type') as 'text' | 'image' | null;
        const sort = searchParams.get('sort') as 'created_asc' | 'created_desc' | 'decrypt_asc' | 'decrypt_desc' | null;

        const result = await getItems({
            status: status || undefined,
            type: type || undefined,
            sort: sort || 'created_desc',
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
            lastDuration: DEFAULT_LOCK_DURATION_MINUTES
        });
    } catch (error) {
        console.error('Error fetching items:', error);
        return NextResponse.json({
            items: [],
            lastDuration: DEFAULT_LOCK_DURATION_MINUTES,
            error: 'Failed to fetch items',
        }, { status: 500 });
    }
}

async function postHandler(request: NextRequest) {
    try {
        const formData = await request.formData();
        const type = formData.get('type') as 'text' | 'image';
        const durationMinutes = formData.get('durationMinutes') ? parseInt(formData.get('durationMinutes') as string, 10) : null;
        const decryptAtTimestamp = formData.get('decryptAt') ? parseInt(formData.get('decryptAt') as string, 10) : null;
        const metadataString = formData.get('metadata') as string;

        if (!type || (!durationMinutes && !decryptAtTimestamp)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let content: string;

        if (type === 'text') {
            const text = formData.get('content') as string;
            if (!text) {
                return NextResponse.json({ error: 'Missing text content' }, { status: 400 });
            }
            content = text;
        } else {
            const file = formData.get('file') as File;
            if (!file) {
                return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
            }

            const arrayBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            content = base64;
        }

        const item = await createItem({
            type,
            content,
            durationMinutes: durationMinutes || undefined,
            decryptAt: decryptAtTimestamp || undefined,
            metadata: metadataString ? JSON.parse(metadataString) : undefined,
        });

        return NextResponse.json({
            success: true,
            item: toSnakeCase({
                id: item.id,
                type: item.type,
                decryptAt: item.decryptAt,
                unlocked: item.unlocked,
                metadata: item.metadata,
            })
        });
    } catch (error) {
        console.error('Error creating item:', error);
        return NextResponse.json({
            error: 'Failed to create item',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export const GET = withRateLimit(getHandler);
export const POST = withRateLimit(postHandler);

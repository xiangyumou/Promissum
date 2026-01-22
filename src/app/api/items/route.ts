import { NextRequest, NextResponse } from 'next/server';
import { createItem, getItems } from '@/lib/services/items/item-service';
import { withRateLimit } from '@/lib/services/rate-limiting/wrapper';

// GET /api/items - List all items
async function getHandler(request: NextRequest) {
    try {
        // Extract query parameters
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as 'all' | 'locked' | 'unlocked' | null;
        const type = searchParams.get('type') as 'text' | 'image' | null;
        const sort = searchParams.get('sort') as 'created_asc' | 'created_desc' | 'decrypt_asc' | 'decrypt_desc' | null;

        // Direct service function call - no HTTP!
        const result = await getItems({
            status: status || undefined,
            type: type || undefined,
            sort: sort || 'created_desc',
        });

        // Transform to match frontend expectations (snake_case)
        const mappedItems = result.items.map(item => ({
            id: item.id,
            type: item.type,
            decrypt_at: item.decryptAt,
            created_at: item.createdAt,
            unlocked: item.unlocked,
            metadata: item.metadata,
        }));

        return NextResponse.json({
            items: mappedItems,
            lastDuration: 720 // Default 12 hours
        });
    } catch (error) {
        console.error('Error fetching items:', error);
        return NextResponse.json({
            items: [], // Return empty array on error to prevent crashes
            lastDuration: 720,
            error: 'Failed to fetch items',
        }, { status: 500 });
    }
}

// POST /api/items - Create new encrypted item
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
            // Convert image File to Base64
            const file = formData.get('file') as File;
            if (!file) {
                return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
            }

            // Read file as ArrayBuffer and convert to Base64
            const arrayBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            content = base64;
        }

        // Direct service function call
        const item = await createItem({
            type,
            content,
            durationMinutes: durationMinutes || undefined,
            decryptAt: decryptAtTimestamp || undefined,
            metadata: metadataString ? JSON.parse(metadataString) : undefined,
        });

        // Transform to snake_case for frontend
        return NextResponse.json({
            success: true,
            item: {
                id: item.id,
                type: item.type,
                decrypt_at: item.decryptAt,
                unlocked: item.unlocked,
                metadata: item.metadata,
            }
        });
    } catch (error) {
        console.error('Error creating item:', error);
        return NextResponse.json({
            error: 'Failed to create item',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Apply rate limiting (optional, can be disabled by setting RATE_LIMIT_MAX=0)
export const GET = withRateLimit(getHandler);
export const POST = withRateLimit(postHandler);

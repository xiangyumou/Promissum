import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// GET /api/items - List all items
export async function GET(request: NextRequest) {
    try {
        // Extract query parameters
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as 'all' | 'locked' | 'unlocked' | null;
        const type = searchParams.get('type') as 'text' | 'image' | null;
        const sort = searchParams.get('sort') as 'created_asc' | 'created_desc' | 'decrypt_asc' | 'decrypt_desc' | null;

        // Call remote API service with filters
        const apiResponse = await apiClient.getItems({
            status: status || undefined,
            type: type || undefined,
            sort: sort || 'created_desc', // Default sort: newest first
        });

        console.log('API Response:', JSON.stringify(apiResponse, null, 2));

        // Handle response - API might return { items: [...] } or just [...]
        let itemsArray: any[];
        if (Array.isArray(apiResponse)) {
            itemsArray = apiResponse;
        } else if (apiResponse && typeof apiResponse === 'object' && 'items' in apiResponse) {
            itemsArray = (apiResponse as any).items;
        } else {
            console.error('Unexpected API response format:', apiResponse);
            return NextResponse.json({
                items: [],
                lastDuration: 720,
                error: 'Unexpected API response format'
            });
        }

        // Map API response to match original format expected by frontend
        const mappedItems = itemsArray.map(item => ({
            id: item.id,
            type: item.type,
            original_name: null, // API doesn't return this in list view
            decrypt_at: item.decryptAt,
            created_at: item.createdAt || Date.now(),
            layer_count: 1, // API doesn't expose layer count in list view
            user_id: 'local', // Not needed but kept for compatibility
            metadata: item.metadata,
        }));

        // Return in original format
        return NextResponse.json({
            items: mappedItems,
            lastDuration: 720 // Default 12 hours, could be stored in localStorage on client
        });
    } catch (error) {
        console.error('Error fetching items from API:', error);
        return NextResponse.json({
            items: [], // Return empty array on error to prevent crashes
            lastDuration: 720,
            error: 'Failed to fetch items',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// POST /api/items - Create new encrypted item
export async function POST(request: NextRequest) {
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

        // Prepare API request payload
        const apiRequest: {
            type: 'text' | 'image';

            content: string;
            durationMinutes?: number;
            decryptAt?: number;
            metadata?: any;
        } = {
            type,
            content,
            metadata: metadataString ? JSON.parse(metadataString) : undefined,
        };

        if (decryptAtTimestamp) {
            apiRequest.decryptAt = decryptAtTimestamp;
        } else {
            apiRequest.durationMinutes = durationMinutes!;
        }

        // Call remote API service
        const apiResponse = await apiClient.createItem(apiRequest);

        // Map response to match original format
        return NextResponse.json({
            success: true,
            item: {
                id: apiResponse.id,
                type: apiResponse.type,
                original_name: null, // API doesn't return this
                decrypt_at: apiResponse.decryptAt,
                created_at: Date.now(),
                layer_count: 1,
                metadata: apiResponse.metadata,
            }
        });
    } catch (error) {
        console.error('Error creating item via API:', error);
        return NextResponse.json({
            error: 'Failed to create item',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

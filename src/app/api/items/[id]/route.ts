import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/items/[id] - Get item with decryption attempt
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Call remote API service (it handles decryption automatically)
        const apiResponse = await apiClient.getItemById(id);

        // Map response to match original format expected by frontend
        const response = {
            id: apiResponse.id,
            type: apiResponse.type,
            original_name: null, // API doesn't return this
            decrypt_at: apiResponse.decryptAt,
            created_at: Date.now(), // API doesn't return this
            layer_count: 1, // API doesn't expose this
            unlocked: apiResponse.unlocked,
            content: apiResponse.content,
            metadata: apiResponse.metadata,
        };

        // For images, ensure proper data URL format
        if (apiResponse.type === 'image' && apiResponse.content) {
            // Check if already has data URL prefix
            if (!apiResponse.content.startsWith('data:image')) {
                response.content = `data:image/png;base64,${apiResponse.content}`;
            }
        }

        return NextResponse.json(response);
    } catch (error) {
        // Check if it's a 404 error
        if (error instanceof Error && error.message.includes('404')) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        console.error('Error fetching item from API:', error);

        return NextResponse.json({
            error: 'Failed to fetch item',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// DELETE /api/items/[id] - Delete item
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Call remote API service
        await apiClient.deleteItem(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        // Check if it's a 404 error
        if (error instanceof Error && error.message.includes('404')) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        console.error('Error deleting item via API:', error);

        return NextResponse.json({
            error: 'Failed to delete item',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

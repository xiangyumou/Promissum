import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';
import { createErrorResponse, logApiError } from '@/lib/api-error';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/items/[id] - Get item with decryption attempt
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Call remote API service (it handles decryption automatically)
        // apiClient returns response in snake_case format
        const apiResponse = await apiClient.getItemById(id);

        // Response already uses snake_case from apiClient
        const response: Record<string, unknown> = {
            id: apiResponse.id,
            type: apiResponse.type,
            decrypt_at: apiResponse.decrypt_at,
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

        logApiError('Error fetching item from API', error);

        return createErrorResponse(error, 'Failed to fetch item');
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

        logApiError('Error deleting item via API', error);

        return createErrorResponse(error, 'Failed to delete item');
    }
}

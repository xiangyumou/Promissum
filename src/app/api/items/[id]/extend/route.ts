import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { minutes } = body;

        // Valid presets: 1m, 10m, 1h, 6h, 1d
        const validMinutes = [1, 10, 60, 360, 1440];
        if (!minutes || !validMinutes.includes(minutes)) {
            return NextResponse.json({
                error: 'Invalid minutes, must be 1, 10, 60, 360, or 1440'
            }, { status: 400 });
        }

        // Call remote API service
        const apiResponse = await apiClient.extendItem(id, minutes);

        return NextResponse.json({
            success: true,
            decrypt_at: apiResponse.decryptAt,
            layer_count: 1, // API doesn't expose this, use default
        });
    } catch (error) {
        console.error('Error extending lock via API:', error);

        // Check for specific error types
        if (error instanceof Error) {
            // If API returns 409 for concurrent modification
            if (error.message.includes('409')) {
                return NextResponse.json({
                    error: 'Concurrent modification detected. Please refresh and try again.'
                }, { status: 409 });
            }

            // If item not found
            if (error.message.includes('404')) {
                return NextResponse.json({ error: 'Item not found' }, { status: 404 });
            }
        }

        return NextResponse.json({
            error: 'Failed to extend lock',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

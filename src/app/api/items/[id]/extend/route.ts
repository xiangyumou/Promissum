import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';
import { ExtendItemSchema, formatZodErrors } from '@/lib/validation';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validate input with Zod
        const validation = ExtendItemSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: formatZodErrors(validation.error)
            }, { status: 400 });
        }

        const { minutes } = validation.data;

        // Valid presets: 1m, 10m, 1h, 6h, 1d
        const validMinutes = [1, 10, 60, 360, 1440];
        if (!validMinutes.includes(minutes)) {
            return NextResponse.json({
                error: 'Invalid minutes, must be 1, 10, 60, 360, or 1440'
            }, { status: 400 });
        }

        // Fetch current item state to check if it's already unlocked
        const item = await apiClient.getItemById(id);
        const now = Date.now();
        let effectiveMinutes = minutes;

        // If item is already unlocked (time in past), we need to add enough minutes
        // to cover the gap between now and decrypt_at, plus the requested minutes.
        // Note: Remote API may return camelCase
        const itemDecryptAt = (item as any).decryptAt || item.decrypt_at;
        if (itemDecryptAt < now) {
            const gapMs = now - itemDecryptAt;
            // gapMinutes needs to be rounded up to ensure we are definitely in the future
            const gapMinutes = Math.ceil(gapMs / (1000 * 60));
            effectiveMinutes = minutes + gapMinutes;
        }

        // Call remote API service with the adjusted duration
        const apiResponse = await apiClient.extendItem(id, effectiveMinutes);

        return NextResponse.json({
            success: true,
            decrypt_at: (apiResponse as any).decryptAt || apiResponse.decrypt_at,
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

import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';
import { createErrorResponse, logApiError } from '@/lib/api-error';

// GET /api/stats - Get system statistics
export async function GET() {
    try {
        const stats = await apiClient.getStats();
        return NextResponse.json(stats);
    } catch (error) {
        logApiError('Error fetching stats from API', error);
        return createErrorResponse(error, 'Failed to fetch statistics');
    }
}

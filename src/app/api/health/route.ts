import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { logApiError } from '@/lib/api-error';

/**
 * Health Check Endpoint
 * Proxies health check to the remote Chaster API
 */
export async function GET(_request: NextRequest) {
    try {
        const response = await fetch(`${env.apiUrl}/../health`, {
            headers: {
                'Authorization': `Bearer ${env.apiToken}`,
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { status: 'error', message: 'Remote API health check failed' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        logApiError('Health check error', error);
        const isProduction = process.env.NODE_ENV === 'production';
        return NextResponse.json(
            {
                status: 'error',
                message: isProduction ? 'Service unavailable' : (error instanceof Error ? error.message : 'Unknown error')
            },
            { status: 503 }
        );
    }
}

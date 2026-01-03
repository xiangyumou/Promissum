import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

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
        console.error('Health check error:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 503 }
        );
    }
}

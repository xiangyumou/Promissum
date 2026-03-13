import { NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';
import { toSnakeCase } from '@/lib/utils';
import { DrandError } from '@/lib/services/encryption/tlock';

type ApiHandler<T = unknown> = () => Promise<NextResponse<T>>;

export async function withApiHandler<T>(handler: ApiHandler<T>): Promise<NextResponse> {
    try {
        return await handler();
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: 'Validation Error', details: error.issues },
                { status: 400 }
            );
        }

        if (error instanceof DrandError) {
            console.error('API Error:', error.message, error);
            return NextResponse.json(
                { error: 'Encryption Service Unavailable', code: error.code },
                { status: 502 }
            );
        }

        const message = error instanceof Error ? error.message : 'Internal Server Error';

        if (message === 'Item not found') {
            return NextResponse.json({ error: message }, { status: 404 });
        }
        if (message.includes('too large')) {
             return NextResponse.json({ error: message }, { status: 413 });
        }
        if (message.includes('Invalid file type')) {
            return NextResponse.json({ error: message }, { status: 415 });
        }

        console.error('API Error:', message, error);
        return NextResponse.json(
            {
                error: message,
                details: process.env.NODE_ENV === 'development' ? error : undefined
            },
            { status: 500 }
        );
    }
}

export function successResponse(data: unknown, status = 200) {
    return NextResponse.json(toSnakeCase(data), { status });
}

export function validateSearchParams<T>(
    url: string, 
    schema: ZodSchema<T>
): T {
    const { searchParams } = new URL(url);
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return schema.parse(params);
}

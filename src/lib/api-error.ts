/**
 * API Error Utilities
 * 
 * Provides secure error handling for API routes.
 * Hides implementation details in production while preserving
 * debugging information in development.
 */

import { NextResponse } from 'next/server';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Standard error response interface
 */
interface ErrorResponseBody {
    error: string;
    details?: string;
}

/**
 * Create a secure error response that hides sensitive details in production
 * 
 * @param error - The caught error
 * @param userMessage - User-friendly error message
 * @param status - HTTP status code (default: 500)
 * @returns NextResponse with appropriate error body
 */
export function createErrorResponse(
    error: unknown,
    userMessage: string,
    status: number = 500
): NextResponse<ErrorResponseBody> {
    // Log full error in all environments for debugging
    // Note: In production, logs should be collected but not exposed to clients
    if (!isProduction) {
        console.error(`[API Error] ${userMessage}:`, error);
    }

    const body: ErrorResponseBody = {
        error: userMessage,
    };

    // Only include details in non-production environments
    if (!isProduction && error instanceof Error) {
        body.details = error.message;
    }

    return NextResponse.json(body, { status });
}

/**
 * Log error to console with appropriate level based on environment
 * Filters stack traces in production to prevent information leakage
 */
export function logApiError(context: string, error: unknown): void {
    if (isProduction) {
        // In production, log only essential info without stack traces
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[API] ${context}: ${message}`);
    } else {
        // In development, log full error for debugging
        console.error(`[API] ${context}:`, error);
    }
}

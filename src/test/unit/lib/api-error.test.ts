/**
 * Tests for API Error Utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Need to test with different NODE_ENV values
// Using vi.stubEnv for proper environment variable mocking

describe('api-error utilities', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    describe('createErrorResponse', () => {
        it('should return user message without details in production', async () => {
            vi.stubEnv('NODE_ENV', 'production');
            const { createErrorResponse } = await import('@/lib/api-error');

            const error = new Error('Sensitive database error details');
            const response = createErrorResponse(error, 'Failed to fetch items');

            expect(response.status).toBe(500);
            const body = await response.json() as { error: string; details?: string };
            expect(body.error).toBe('Failed to fetch items');
            expect(body.details).toBeUndefined();
        });

        it('should include error details in development', async () => {
            vi.stubEnv('NODE_ENV', 'development');
            const { createErrorResponse } = await import('@/lib/api-error');

            const error = new Error('Detailed error message');
            const response = createErrorResponse(error, 'Failed to fetch items');

            expect(response.status).toBe(500);
            const body = await response.json() as { error: string; details?: string };
            expect(body.error).toBe('Failed to fetch items');
            expect(body.details).toBe('Detailed error message');
        });

        it('should use custom status code', async () => {
            vi.stubEnv('NODE_ENV', 'production');
            const { createErrorResponse } = await import('@/lib/api-error');

            const error = new Error('Not found');
            const response = createErrorResponse(error, 'Item not found', 404);

            expect(response.status).toBe(404);
        });

        it('should handle non-Error objects', async () => {
            vi.stubEnv('NODE_ENV', 'development');
            const { createErrorResponse } = await import('@/lib/api-error');

            const error = 'String error';
            const response = createErrorResponse(error, 'Something went wrong');

            const body = await response.json() as { error: string; details?: string };
            expect(body.error).toBe('Something went wrong');
            // Non-Error objects don't get details even in development
            expect(body.details).toBeUndefined();
        });
    });

    describe('logApiError', () => {
        beforeEach(() => {
            vi.spyOn(console, 'error').mockImplementation(() => { });
        });

        it('should log minimal info in production', async () => {
            vi.stubEnv('NODE_ENV', 'production');
            const { logApiError } = await import('@/lib/api-error');

            const error = new Error('Sensitive stack trace here');
            logApiError('Database operation', error);

            expect(console.error).toHaveBeenCalledWith(
                '[API] Database operation: Sensitive stack trace here'
            );
        });

        it('should log full error in development', async () => {
            vi.stubEnv('NODE_ENV', 'development');
            const { logApiError } = await import('@/lib/api-error');

            const error = new Error('Development error');
            logApiError('Test context', error);

            expect(console.error).toHaveBeenCalledWith(
                '[API] Test context:',
                error
            );
        });

        it('should handle unknown error types in production', async () => {
            vi.stubEnv('NODE_ENV', 'production');
            const { logApiError } = await import('@/lib/api-error');

            const error = { custom: 'error object' };
            logApiError('Custom error', error);

            expect(console.error).toHaveBeenCalledWith(
                '[API] Custom error: Unknown error'
            );
        });
    });
});

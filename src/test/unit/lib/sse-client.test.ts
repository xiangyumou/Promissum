import { describe, it, expect } from 'vitest';
import { sseClient } from '@/lib/sse-client';

describe('SSE Client', () => {
    describe('Module Export', () => {
        it('should export sseClient instance', () => {
            expect(sseClient).toBeDefined();
            expect(typeof sseClient.connect).toBe('function');
            expect(typeof sseClient.disconnect).toBe('function');
        });

        it('should have expected methods', () => {
            expect(sseClient).toHaveProperty('connect');
            expect(sseClient).toHaveProperty('disconnect');
        });
    });

    // Note: Full SSE testing requires integration tests with actual server
    // Mocking EventSource properly is complex and error-prone
    // The component tests (SyncProvider) provide integration coverage
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sseClient } from '@/lib/sse-client';
import { QueryClient } from '@tanstack/react-query';
import { useSettings } from '@/lib/stores/settings-store';
import { queryKeys } from '@/lib/queries';

// Mock getDeviceId
vi.mock('@/lib/device-id', () => ({
    getDeviceId: vi.fn().mockResolvedValue('test-device-id'),
}));

// Mock useSettings
vi.mock('@/lib/stores/settings-store', () => ({
    useSettings: {
        setState: vi.fn(),
    },
}));

describe('SSE Client', () => {
    let mockEventSource: any;
    let queryClient: QueryClient;

    // Setup Mock EventSource Class
    class MockEventSource {
        url: string;
        onopen: (() => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((error: Event) => void) | null = null;
        close = vi.fn();
        listeners: Record<string, Function[]> = {};

        constructor(url: string) {
            this.url = url;
            mockEventSource = this;
        }

        addEventListener(type: string, callback: Function) {
            if (!this.listeners[type]) {
                this.listeners[type] = [];
            }
            this.listeners[type].push(callback);
        }

        // Helper to simulate incoming events
        simulateOpen() {
            if (this.onopen) this.onopen();
        }

        simulateError(error: any) {
            if (this.onerror) this.onerror(error);
        }

        simulateMessage(data: any) {
            if (this.onmessage) {
                this.onmessage({ data: JSON.stringify(data) } as MessageEvent);
            }
        }

        simulateCustomEvent(type: string, data: any) {
            const handlers = this.listeners[type];
            if (handlers) {
                handlers.forEach(handler => handler({ data: JSON.stringify(data) }));
            }
        }
    }

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        global.EventSource = MockEventSource as any;
        queryClient = new QueryClient();
        vi.spyOn(queryClient, 'invalidateQueries');

        // Reset sseClient state
        sseClient.disconnect();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should connect to SSE endpoint with deviceId', async () => {
        await sseClient.connect(queryClient);

        expect(mockEventSource).toBeDefined();
        expect(mockEventSource.url).toBe('/api/events?deviceId=test-device-id');
    });

    it('should not connect if already connected', async () => {
        await sseClient.connect(queryClient);
        const firstSource = mockEventSource;

        await sseClient.connect(queryClient);
        expect(mockEventSource).toBe(firstSource); // Should remain same instance
    });

    it('should handle successful connection', async () => {
        await sseClient.connect(queryClient);
        mockEventSource.simulateOpen();

        // Internal state check if possible, or verify no errors
        expect(mockEventSource.close).not.toHaveBeenCalled();
    });

    it('should handle connection error and retry', async () => {
        const connectSpy = vi.spyOn(sseClient, 'connect');
        await sseClient.connect(queryClient);

        // Simulate Error
        mockEventSource.simulateError(new Event('error'));

        expect(mockEventSource.close).toHaveBeenCalled();

        // Fast forward time to trigger retry
        vi.runAllTimers();

        expect(connectSpy).toHaveBeenCalledTimes(2); // Initial + Retry
    });

    it('should handle "settings-updated" event from other device', async () => {
        await sseClient.connect(queryClient);

        const eventData = {
            deviceId: 'other-device-id',
            preferences: { theme: 'dark' }
        };

        mockEventSource.simulateCustomEvent('settings-updated', eventData);

        await vi.waitFor(() => {
            expect(useSettings.setState).toHaveBeenCalledWith(expect.any(Function));
        });
    });

    it('should ignore "settings-updated" event from same device', async () => {
        await sseClient.connect(queryClient);

        const eventData = {
            deviceId: 'test-device-id', // Same as mocked getDeviceId
            preferences: { theme: 'dark' }
        };

        mockEventSource.simulateCustomEvent('settings-updated', eventData);

        expect(useSettings.setState).not.toHaveBeenCalled();
    });

    it('should invalidate queries on "item-locked"', async () => {
        await sseClient.connect(queryClient);

        mockEventSource.simulateCustomEvent('item-locked', { itemId: 'item-123' });

        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.items.detail('item-123') });
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.items.all });
    });

    it('should disconnect and cleanup', async () => {
        await sseClient.connect(queryClient);

        sseClient.disconnect();

        expect(mockEventSource.close).toHaveBeenCalled();
    });
});

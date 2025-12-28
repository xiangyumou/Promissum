/**
 * SSE Client (Server-Sent Events)
 * 
 * Handles real-time connection to the server.
 * Automatically reconnects on disconnect.
 */

import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queries';
import { getDeviceId } from './device-id';
import { useSettings } from './stores/settings-store';

type EventType = 'settings-updated' | 'item-locked' | 'item-unlocked' | 'item-deleted' | 'connected' | 'ping';

interface SseEvent {
    type: EventType;
    data: any;
}

class SseClient {
    private eventSource: EventSource | null = null;
    private queryClient: QueryClient | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isConnected: boolean = false;

    // Connect to SSE stream
    async connect(queryClient: QueryClient) {
        if (this.eventSource) return;

        this.queryClient = queryClient;
        const deviceId = await getDeviceId();

        console.log('Connecting to SSE stream...');
        this.eventSource = new EventSource(`/api/events?deviceId=${deviceId}`);

        this.eventSource.onopen = () => {
            console.log('SSE Connected');
            this.isConnected = true;
            if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        };

        this.eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
            this.eventSource?.close();
            this.eventSource = null;
            this.isConnected = false;

            // Retry connection in 5 seconds
            this.reconnectTimeout = setTimeout(() => this.connect(queryClient), 5000);
        };

        // Listen for specific events
        this.eventSource.addEventListener('settings-updated', (event) => {
            const data = JSON.parse(event.data);
            this.handleSettingsUpdate(data);
        });

        this.eventSource.addEventListener('item-locked', (event) => {
            const data = JSON.parse(event.data);
            this.handleItemLocked(data);
        });

        this.eventSource.addEventListener('item-unlocked', (event) => {
            const data = JSON.parse(event.data);
            this.handleItemUnlocked(data);
        });

        // Listen for generic messages
        this.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'connected') {
                console.log('SSE Handshake complete');
            }
        };
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            this.isConnected = false;
        }
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    }

    /**
     * Handle remote settings update
     */
    private async handleSettingsUpdate(data: any) {
        console.log('Received remote settings update:', data);

        // If update is from another device (checked by deviceId)
        const myDeviceId = await getDeviceId();
        if (data.deviceId === myDeviceId) {
            console.log('Ignoring own settings update');
            return;
        }

        // For now, let's just invalidate queries or update store directly?
        // Settings are in Zustand, not React Query.
        // We need to update Zustand store.

        // This is tricky because SseClient is outside React context.
        // We can import the store directly.
        useSettings.setState((state) => ({
            ...state,
            ...data.preferences
        }));
    }

    private handleItemLocked(data: any) {
        if (!this.queryClient) return;
        console.log('Item locked remotely:', data.itemId);
        this.queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(data.itemId) });
        this.queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
    }

    private handleItemUnlocked(data: any) {
        if (!this.queryClient) return;
        console.log('Item unlocked remotely:', data.itemId);
        this.queryClient.invalidateQueries({ queryKey: queryKeys.items.detail(data.itemId) });
        this.queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
    }
}

export const sseClient = new SseClient();

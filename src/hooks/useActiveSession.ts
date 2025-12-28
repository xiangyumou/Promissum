import { useEffect, useRef } from 'react';
import { getDeviceId } from '@/lib/device-id';

/**
 * Hook to track active session for an item
 * Sends periodic heartbeats to /api/sessions
 */
export function useActiveSession(itemId: string | null) {
    const intervalRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        if (!itemId) return;

        const registerSession = async () => {
            try {
                const deviceId = await getDeviceId();
                await fetch('/api/sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deviceId, itemId }),
                });
            } catch (error) {
                console.error('Failed to register session:', error);
            }
        };

        const unregisterSession = async () => {
            try {
                const deviceId = await getDeviceId();
                // Use sendBeacon for reliable cleanup on unload
                const url = `/api/sessions?deviceId=${deviceId}&itemId=${itemId}`;
                if (navigator.sendBeacon) {
                    navigator.sendBeacon(url, null); // DELETE not supported by beacon, handled by API?
                    // Actually, standard beacon is POST. Most APIs use POST for beacon.
                    // Our API expects DELETE for cleanup. 
                    // Use fetch with keepalive for standard navigation
                    await fetch(url, { method: 'DELETE', keepalive: true });
                } else {
                    await fetch(url, { method: 'DELETE', keepalive: true });
                }
            } catch (error) {
                console.error('Failed to unregister session:', error);
            }
        };

        // Initial registration
        registerSession();

        // Heartbeat every 2 minutes
        intervalRef.current = setInterval(registerSession, 2 * 60 * 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            unregisterSession();
        };
    }, [itemId]);
}

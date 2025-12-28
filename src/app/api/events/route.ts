/**
 * API Route: /api/events
 * 
 * Server-Sent Events (SSE) endpoint for real-time updates.
 * Broadcasts events: settings-updated, item-locked, item-unlocked, etc.
 */

import { NextRequest } from 'next/server';

// Store active clients in memory (for now)
// In production with multiple instances, use Redis Pub/Sub
const clients = new Set<ReadableStreamDefaultController>();

// Event types
type EventType = 'settings-updated' | 'item-locked' | 'item-unlocked' | 'item-deleted' | 'ping';

export async function GET(request: NextRequest) {
    const encoder = new TextEncoder();

    // Create a streaming response
    const customReadable = new ReadableStream({
        start(controller) {
            clients.add(controller);
            console.log('SSE Client connected');

            // Send initial connection message
            const initialData = `data: ${JSON.stringify({ type: 'connected' })}\n\n`;
            controller.enqueue(encoder.encode(initialData));
        },
        cancel(controller) {
            clients.delete(controller);
            console.log('SSE Client disconnected');
        }
    });

    return new Response(customReadable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Encoding': 'none',
        },
    });
}

/**
 * Helpher to broadcast events to all connected clients
 * This should be called by other API routes when state changes
 */
export function broadcastEvent(type: EventType, data: any) {
    const encoder = new TextEncoder();
    const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;

    clients.forEach((client) => {
        try {
            client.enqueue(encoder.encode(message));
        } catch (error) {
            // Client likely disconnected without clean close
            clients.delete(client);
        }
    });
}

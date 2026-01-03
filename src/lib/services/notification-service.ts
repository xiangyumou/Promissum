/**
 * Notification Service
 * 
 * Handles browser notifications for item unlock reminders and alerts.
 * Uses Web Notification API with permission management.
 */

export type NotificationPermission = 'default' | 'granted' | 'denied';

export interface UnlockNotification {
    itemId: string;
    itemTitle: string;
    unlockTime: number;
    type: 'soon' | 'unlocked';
}

class NotificationService {
    private permissionStatus: NotificationPermission = 'default';
    private scheduledNotifications = new Map<string, number>();

    constructor() {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            this.permissionStatus = Notification.permission;
        }
    }

    /**
     * Request notification permission from the user
     */
    async requestPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return 'denied';
        }

        if (this.permissionStatus === 'granted') {
            return 'granted';
        }

        const permission = await Notification.requestPermission();
        this.permissionStatus = permission;
        return permission;
    }

    /**
     * Get current permission status
     */
    getPermissionStatus(): NotificationPermission {
        return this.permissionStatus;
    }

    /**
     * Check if notifications are supported and permitted
     */
    isEnabled(): boolean {
        return (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            this.permissionStatus === 'granted'
        );
    }

    /**
     * Show a notification immediately
     */
    showNotification(
        title: string,
        body: string,
        options?: {
            icon?: string;
            tag?: string;
            requireInteraction?: boolean;
            data?: unknown;
        }
    ): Notification | null {
        if (!this.isEnabled()) {
            console.warn('Notifications are not enabled');
            return null;
        }

        const notification = new Notification(title, {
            body,
            icon: options?.icon || '/favicon.ico',
            tag: options?.tag,
            requireInteraction: options?.requireInteraction || false,
            badge: '/favicon.ico',
            ...options,
        });

        // Auto-close after 10 seconds if not require interaction
        if (!options?.requireInteraction) {
            setTimeout(() => notification.close(), 10000);
        }

        return notification;
    }

    /**
     * Schedule unlock notifications for an item
     * Will notify at configured times before unlock (e.g., 5 min, 1 hour)
     */
    scheduleUnlockNotification(
        itemId: string,
        itemTitle: string,
        unlockTime: number,
        reminderMinutes: number[] = [5, 60] // Default: 5 min and 1 hour before
    ): void {
        if (!this.isEnabled()) {
            return;
        }

        const now = Date.now();

        // Cancel existing notifications for this item
        this.cancelScheduledNotifications(itemId);

        // Schedule "soon" notifications
        reminderMinutes.forEach((minutes) => {
            const notifyTime = unlockTime - minutes * 60 * 1000;
            const delay = notifyTime - now;

            if (delay > 0) {
                const timeoutId = window.setTimeout(() => {
                    this.showNotification(
                        `${itemTitle} unlocking soon!`,
                        `Will unlock in ${minutes} minute${minutes === 1 ? '' : 's'}`,
                        {
                            tag: `unlock-soon-${itemId}`,
                            requireInteraction: false,
                            data: { itemId, type: 'soon' },
                        }
                    );
                }, delay);

                this.scheduledNotifications.set(`${itemId}-${minutes}`, timeoutId);
            }
        });

        // Schedule "unlocked" notification
        const unlockDelay = unlockTime - now;
        if (unlockDelay > 0) {
            const timeoutId = window.setTimeout(() => {
                this.showNotification(
                    `${itemTitle} unlocked! 🎉`,
                    'Your content is now available to view',
                    {
                        tag: `unlocked-${itemId}`,
                        requireInteraction: true,
                        data: { itemId, type: 'unlocked' },
                    }
                );

                // Clean up this item's scheduled notifications
                this.cancelScheduledNotifications(itemId);
            }, unlockDelay);

            this.scheduledNotifications.set(`${itemId}-unlocked`, timeoutId);
        }
    }

    /**
     * Cancel all scheduled notifications for an item
     */
    cancelScheduledNotifications(itemId: string): void {
        const keys = Array.from(this.scheduledNotifications.keys()).filter((key) =>
            key.startsWith(itemId)
        );

        keys.forEach((key) => {
            const timeoutId = this.scheduledNotifications.get(key);
            if (timeoutId) {
                clearTimeout(timeoutId);
                this.scheduledNotifications.delete(key);
            }
        });
    }

    /**
     * Cancel all scheduled notifications
     */
    cancelAll(): void {
        this.scheduledNotifications.forEach((timeoutId) => {
            clearTimeout(timeoutId);
        });
        this.scheduledNotifications.clear();
    }

    /**
     * Get count of scheduled notifications
     */
    getScheduledCount(): number {
        return this.scheduledNotifications.size;
    }
}

// Export singleton instance
export const notificationService = new NotificationService();

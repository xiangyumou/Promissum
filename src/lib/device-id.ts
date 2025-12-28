/**
 * Device Fingerprinting
 * 
 * Generates stable device IDs using browser characteristics.
 * Uses @fingerprintjs/fingerprintjs for reliable, privacy-friendly fingerprinting.
 * Falls back to random UUID if fingerprinting fails.
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';

const DEVICE_ID_KEY = 'promissum_device_id';

let cachedDeviceId: string | null = null;

/**
 * Get or generate a stable device ID
 * Stored in localStorage for persistence across sessions
 */
export async function getDeviceId(): Promise<string> {
    // Return cached ID if available
    if (cachedDeviceId) {
        return cachedDeviceId;
    }

    // Try to get from localStorage first
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(DEVICE_ID_KEY);
        if (stored) {
            cachedDeviceId = stored;
            return stored;
        }
    }

    // Generate new fingerprint
    try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const deviceId = result.visitorId;

        // Store in localStorage and cache
        if (typeof window !== 'undefined') {
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }
        cachedDeviceId = deviceId;

        return deviceId;
    } catch (error) {
        console.error('Failed to generate device fingerprint:', error);

        // Fallback to random UUID
        const fallbackId = `device_${crypto.randomUUID()}`;
        if (typeof window !== 'undefined') {
            localStorage.setItem(DEVICE_ID_KEY, fallbackId);
        }
        cachedDeviceId = fallbackId;

        return fallbackId;
    }
}

/**
 * Get device name from user agent for better UX
 * e.g., "Chrome on macOS"
 */
export function getDeviceName(): string {
    if (typeof window === 'undefined') {
        return 'Unknown Device';
    }

    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    // Detect browser
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
        browser = 'Chrome';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
        browser = 'Safari';
    } else if (ua.includes('Firefox')) {
        browser = 'Firefox';
    } else if (ua.includes('Edg')) {
        browser = 'Edge';
    }

    // Detect OS
    if (ua.includes('Mac OS X')) {
        os = 'macOS';
    } else if (ua.includes('Windows')) {
        os = 'Windows';
    } else if (ua.includes('Linux')) {
        os = 'Linux';
    } else if (ua.includes('Android')) {
        os = 'Android';
    } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
        os = 'iOS';
    }

    return `${browser} on ${os}`;
}

/**
 * Reset device ID (for testing or user logout)
 */
export function resetDeviceId(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(DEVICE_ID_KEY);
    }
    cachedDeviceId = null;
}

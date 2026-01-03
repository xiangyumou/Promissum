/**
 * Device ID Generation
 * 
 * Simple UUID-based device ID with localStorage persistence.
 * Falls back to session-only ID if localStorage is unavailable.
 */

const DEVICE_ID_KEY = 'promissum_device_id';

let cachedDeviceId: string | null = null;

/**
 * Get or generate a stable device ID
 * Uses simple UUID generation with localStorage persistence.
 */
export function getDeviceId(): string {
    // Return cached ID if available
    if (cachedDeviceId) {
        return cachedDeviceId;
    }

    // Try to get from localStorage first
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem(DEVICE_ID_KEY);
            if (stored) {
                cachedDeviceId = stored;
                return stored;
            }
        } catch {
            // localStorage unavailable, continue to generate
        }
    }

    // Generate new UUID
    const deviceId = crypto.randomUUID();

    // Store in localStorage and cache
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
        } catch {
            // localStorage unavailable, ID will only persist in memory
        }
    }
    cachedDeviceId = deviceId;

    return deviceId;
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
        try {
            localStorage.removeItem(DEVICE_ID_KEY);
        } catch {
            // Ignore localStorage errors
        }
    }
    cachedDeviceId = null;
}

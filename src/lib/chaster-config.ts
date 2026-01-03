/**
 * Chaster SDK Configuration
 * 
 * Initialize the Chaster client SDK with environment-based or custom configuration.
 * This module wraps the SDK's OpenAPI configuration for easy setup.
 */

import { OpenAPI } from '@xymou/chaster-client';
import { useSettings } from './stores/settings-store';

/**
 * Initialize Chaster SDK with the given or default configuration.
 * Call this once at application startup (e.g., in layout.tsx or _app.tsx).
 */
export function initChasterSDK(options?: {
    baseUrl?: string;
    token?: string;
}) {
    OpenAPI.BASE = options?.baseUrl || 
        process.env.CHASTER_API_URL || 
        'http://localhost:3000/api/v1';
    
    OpenAPI.TOKEN = options?.token || 
        process.env.CHASTER_API_TOKEN || 
        undefined;
}

/**
 * Configure SDK with dynamic settings from the store.
 * This is useful when user settings override environment config.
 */
export function configureSDKFromSettings() {
    const { apiUrl, apiToken } = useSettings.getState();
    
    if (apiUrl) {
        OpenAPI.BASE = apiUrl;
    }
    if (apiToken) {
        OpenAPI.TOKEN = apiToken;
    }
}

/**
 * Get current SDK configuration (for debugging)
 */
export function getSDKConfig() {
    return {
        BASE: OpenAPI.BASE,
        TOKEN: OpenAPI.TOKEN ? '***' : undefined, // Mask token for security
        VERSION: OpenAPI.VERSION,
    };
}

/**
 * Re-export SDK types and services for convenience
 */
export { 
    OpenAPI,
    ItemsService, 
    SystemService, 
    AdminService, 
    ExportService, 
    ImportService 
} from '@xymou/chaster-client';

export type { 
    Item, 
    ItemInput, 
    OpenAPIConfig 
} from '@xymou/chaster-client';

/**
 * Environment Configuration
 *
 * Type-safe access to environment variables for the Chaster API.
 * Works in conjunction with @xymou/chaster-client SDK.
 */

const env = {
  /**
   * Base URL for the Chaster API service
   * @example "http://localhost:3000/api/v1"
   */
  apiUrl: process.env.CHASTER_API_URL || 'http://localhost:3000/api/v1',

  /**
   * Bearer token for API authentication
   */
  apiToken: process.env.CHASTER_API_TOKEN || '',

  /**
   * Next.js public app URL (for client-side)
   */
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  /**
   * Date and time format for display
   * @default 'yyyy-MM-dd HH:mm'
   */
  dateFormat: process.env.NEXT_PUBLIC_DATE_FORMAT || 'yyyy-MM-dd HH:mm',

  /**
   * Auto-refresh interval in seconds
   * @default 60
   */
  autoRefreshInterval: parseInt(process.env.NEXT_PUBLIC_AUTO_REFRESH_INTERVAL || '60', 10),

  /**
   * Cache TTL in minutes
   * @default 5
   */
  cacheTTLMinutes: parseInt(process.env.NEXT_PUBLIC_CACHE_TTL || '5', 10),
} as const;

/**
 * Validate that required environment variables are set
 * @throws Error if required variables are missing
 */
export function validateEnv(): void {
  const errors: string[] = [];

  // Only validate apiToken - apiUrl has a valid default for development
  if (!env.apiToken) {
    errors.push('CHASTER_API_TOKEN is not set');
  }

  if (errors.length > 0) {
    throw new Error(
      `Environment configuration error: ${errors.join(', ')}. ` +
      'Please configure them in .env.local'
    );
  }
}

export default env;
export { env };

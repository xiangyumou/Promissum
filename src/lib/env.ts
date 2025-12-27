/**
 * Environment Configuration
 * 
 * Type-safe access to environment variables for the Chaster API.
 */

export const env = {
  /**
   * Base URL for the Chaster API service
   * @example "http://localhost:3000/api/v1"
   */
  apiUrl: process.env.CHASTER_API_URL || 'http://localhost:3000/api/v1',
  
  /**
   * Bearer token for API authentication
   */
  apiToken: process.env.CHASTER_API_TOKEN || '',
} as const;

/**
 * Validate that required environment variables are set
 * @throws Error if required variables are missing
 */
export function validateEnv(): void {
  if (!env.apiToken) {
    throw new Error(
      'CHASTER_API_TOKEN is not set. Please configure it in .env.local'
    );
  }
  
  if (!env.apiUrl) {
    throw new Error(
      'CHASTER_API_URL is not set. Please configure it in .env.local'
    );
  }
}

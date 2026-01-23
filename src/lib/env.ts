const env = {
  apiUrl: process.env.PROMISSUM_API_URL || process.env.CHASTER_API_URL || 'http://localhost:3000/api/v1',

  apiToken: process.env.PROMISSUM_API_TOKEN || process.env.CHASTER_API_TOKEN || '',

  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  dateFormat: process.env.NEXT_PUBLIC_DATE_FORMAT || 'yyyy-MM-dd HH:mm',

  autoRefreshInterval: parseInt(process.env.NEXT_PUBLIC_AUTO_REFRESH_INTERVAL || '60', 10),

  cacheTTLMinutes: parseInt(process.env.NEXT_PUBLIC_CACHE_TTL || '5', 10),
} as const;

export function validateEnv(): void {
  const errors: string[] = [];

  if (!env.apiToken) {
    errors.push('PROMISSUM_API_TOKEN is not set');
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

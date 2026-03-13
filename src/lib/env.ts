/**
 * Environment configuration
 * Only includes settings that truly need to be configurable via environment variables.
 * Other settings have sensible defaults hardcoded where they are used.
 */
const env = {
  // Database path - only necessary env var for SQLite
  dbPath: process.env.DATABASE_URL || './promissum.db',
} as const;

export default env;
export { env };

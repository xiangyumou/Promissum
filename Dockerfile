# =============================================================================
# Build Stage
# =============================================================================
FROM node:22-slim AS builder

WORKDIR /app

# Install build dependencies (needed for native modules like better-sqlite3)
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the Next.js application
RUN npm run build

# =============================================================================
# Runner Stage
# =============================================================================
FROM node:22-slim AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV DATABASE_URL=/data/promissum.db

# Install runtime dependencies, create user, and set up directories in one layer
RUN apt-get update && apt-get install -y \
    openssl \
    gosu \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs \
    && mkdir -p /data \
    && chown nextjs:nodejs /data

# Copy necessary files from builder (with --chown to set ownership during copy)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]

# Start the application (run as nextjs user via entrypoint)
CMD ["gosu", "nextjs:nodejs", "npm", "run", "start"]

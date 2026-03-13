#!/bin/sh
# =============================================================================
# Docker Entrypoint Script for Promissum
# =============================================================================
# This script runs on container startup to:
# 1. Create the data directory if it doesn't exist
# 2. Initialize the database if it doesn't exist
# 3. Apply any pending migrations
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "  Promissum Docker Entrypoint"
echo "========================================"

# Ensure data directory exists
if [ ! -d "/data" ]; then
    echo "${YELLOW}Creating data directory...${NC}"
    mkdir -p /data
fi

# Set correct permissions for data directory
echo "${YELLOW}Setting data directory permissions...${NC}"
chmod 755 /data
chown nextjs:nodejs /data

# Database file will be created automatically by drizzle.ts if it doesn't exist
if [ -f "/data/promissum.db" ]; then
    echo "${GREEN}Database file exists.${NC}"
else
    echo "${YELLOW}Database file not found. It will be created automatically.${NC}"
fi

# Apply migrations using drizzle-kit
echo "${YELLOW}Applying database migrations...${NC}"

# Run migrations with drizzle-kit as nextjs user
# Note: We use npx to run the locally installed drizzle-kit
if gosu nextjs:nodejs npx drizzle-kit migrate --config=./drizzle.config.ts; then
    echo "${GREEN}Migrations applied successfully.${NC}"
else
    echo "${RED}Failed to apply migrations. Exiting.${NC}"
    exit 1
fi

echo "${GREEN}Database setup complete!${NC}"
echo ""
echo "========================================"
echo "  Starting Promissum Application"
echo "========================================"

# Start the application
exec "$@"

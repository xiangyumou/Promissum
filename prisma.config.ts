/**
 * Prisma 7 Configuration
 * 
 * Datasource URL is now configured here instead of in schema.prisma
 * See: https://pris.ly/d/prisma7-client-config
 */

import { defineConfig } from '@prisma/config';
import path from 'path';

export default defineConfig({
    datasource: {
        url: process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'prisma/data/frontend.db')}`,
    },
});

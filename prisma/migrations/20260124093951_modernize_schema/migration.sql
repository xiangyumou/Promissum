-- AlterTable
ALTER TABLE "items" ALTER COLUMN "decrypt_at" TYPE TIMESTAMP(3) USING to_timestamp("decrypt_at" / 1000.0);
ALTER TABLE "items" ALTER COLUMN "created_at" TYPE TIMESTAMP(3) USING to_timestamp("created_at" / 1000.0);
ALTER TABLE "items" ALTER COLUMN "metadata" TYPE JSONB USING "metadata"::jsonb;

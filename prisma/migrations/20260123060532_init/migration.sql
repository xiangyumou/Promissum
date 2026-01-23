-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "name" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "defaultDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "privacyMode" BOOLEAN NOT NULL DEFAULT false,
    "panicUrl" TEXT NOT NULL DEFAULT 'https://google.com',
    "themeConfig" TEXT NOT NULL DEFAULT '{}',
    "dateTimeFormat" TEXT NOT NULL DEFAULT 'yyyy-MM-dd HH:mm',
    "compactMode" BOOLEAN NOT NULL DEFAULT false,
    "sidebarOpen" BOOLEAN NOT NULL DEFAULT true,
    "confirmDelete" BOOLEAN NOT NULL DEFAULT true,
    "confirmExtend" BOOLEAN NOT NULL DEFAULT true,
    "autoRefreshInterval" INTEGER NOT NULL DEFAULT 60,
    "cacheTTLMinutes" INTEGER NOT NULL DEFAULT 5,
    "autoPrivacyDelayMinutes" INTEGER NOT NULL DEFAULT 5,
    "panicShortcut" TEXT NOT NULL DEFAULT 'alt+p',
    "apiToken" TEXT NOT NULL DEFAULT '',
    "apiUrl" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveSession" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActive" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecryptCache" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "decryptAt" BIGINT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecryptCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedItem" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3),

    CONSTRAINT "SharedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "encrypted_data" TEXT NOT NULL,
    "original_name" TEXT,
    "decrypt_at" BIGINT NOT NULL,
    "round_number" BIGINT NOT NULL,
    "created_at" BIGINT NOT NULL,
    "layer_count" INTEGER NOT NULL DEFAULT 1,
    "metadata" TEXT,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "api_logs" (
    "id" TEXT NOT NULL,
    "token" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "duration" INTEGER,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_fingerprint_key" ON "Device"("fingerprint");

-- CreateIndex
CREATE INDEX "Device_fingerprint_idx" ON "Device"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_deviceId_key" ON "UserPreferences"("deviceId");

-- CreateIndex
CREATE INDEX "UserPreferences_deviceId_idx" ON "UserPreferences"("deviceId");

-- CreateIndex
CREATE INDEX "ActiveSession_deviceId_idx" ON "ActiveSession"("deviceId");

-- CreateIndex
CREATE INDEX "ActiveSession_itemId_idx" ON "ActiveSession"("itemId");

-- CreateIndex
CREATE INDEX "ActiveSession_lastActive_idx" ON "ActiveSession"("lastActive");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveSession_deviceId_itemId_key" ON "ActiveSession"("deviceId", "itemId");

-- CreateIndex
CREATE INDEX "DecryptCache_expiresAt_idx" ON "DecryptCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SharedItem_shareToken_key" ON "SharedItem"("shareToken");

-- CreateIndex
CREATE INDEX "SharedItem_itemId_idx" ON "SharedItem"("itemId");

-- CreateIndex
CREATE INDEX "SharedItem_shareToken_idx" ON "SharedItem"("shareToken");

-- CreateIndex
CREATE INDEX "SharedItem_expiresAt_idx" ON "SharedItem"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_items_decrypt_at" ON "items"("decrypt_at");

-- CreateIndex
CREATE INDEX "idx_items_created_at" ON "items"("created_at");

-- CreateIndex
CREATE INDEX "idx_api_logs_timestamp" ON "api_logs"("timestamp");

-- CreateIndex
CREATE INDEX "idx_api_logs_token" ON "api_logs"("token");

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveSession" ADD CONSTRAINT "ActiveSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

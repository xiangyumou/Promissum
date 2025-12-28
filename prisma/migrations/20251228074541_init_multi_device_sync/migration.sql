-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fingerprint" TEXT NOT NULL,
    "name" TEXT,
    "lastSeenAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPreferences_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActiveSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActive" DATETIME NOT NULL,
    CONSTRAINT "ActiveSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DecryptCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "decryptAt" BIGINT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
CREATE INDEX "DecryptCache_expiresAt_idx" ON "DecryptCache"("expiresAt");

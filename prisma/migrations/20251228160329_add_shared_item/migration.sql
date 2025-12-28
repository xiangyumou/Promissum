-- CreateTable
CREATE TABLE "SharedItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedItem_shareToken_key" ON "SharedItem"("shareToken");

-- CreateIndex
CREATE INDEX "SharedItem_itemId_idx" ON "SharedItem"("itemId");

-- CreateIndex
CREATE INDEX "SharedItem_shareToken_idx" ON "SharedItem"("shareToken");

-- CreateIndex
CREATE INDEX "SharedItem_expiresAt_idx" ON "SharedItem"("expiresAt");

/*
  Warnings:

  - A unique constraint covering the columns `[deviceId,itemId]` on the table `ActiveSession` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ActiveSession_deviceId_itemId_key" ON "ActiveSession"("deviceId", "itemId");

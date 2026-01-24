/*
  Warnings:

  - You are about to drop the `DecryptCache` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SharedItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "DecryptCache";

-- DropTable
DROP TABLE "SharedItem";

-- CreateIndex
CREATE INDEX "items_type_decrypt_at_idx" ON "items"("type", "decrypt_at");

-- CreateIndex
CREATE INDEX "items_type_created_at_idx" ON "items"("type", "created_at");

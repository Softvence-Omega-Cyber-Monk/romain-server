/*
  Warnings:

  - A unique constraint covering the columns `[code,sessionId]` on the table `Programme` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Programme" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Programme_code_sessionId_key" ON "Programme"("code", "sessionId");

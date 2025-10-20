/*
  Warnings:

  - A unique constraint covering the columns `[prefix]` on the table `Institution` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Institution_prefix_key" ON "Institution"("prefix");

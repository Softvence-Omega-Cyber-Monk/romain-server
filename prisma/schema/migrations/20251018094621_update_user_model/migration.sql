/*
  Warnings:

  - You are about to drop the column `studentId` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[registrationId]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_institutionId_fkey";

-- DropIndex
DROP INDEX "Student_studentId_key";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "studentId",
ADD COLUMN     "registrationId" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "institutionId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Student_registrationId_key" ON "Student"("registrationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

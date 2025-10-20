/*
  Warnings:

  - You are about to drop the column `registrationId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `User` table. All the data in the column will be lost.
  - You are about to alter the column `coast` on the `level` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - A unique constraint covering the columns `[registrationNumber]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID_TO_PLATFORM', 'READY_FOR_PAYOUT', 'PAID_TO_SCHOOL');

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_studentId_fkey";

-- DropIndex
DROP INDEX "Student_registrationId_key";

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "isActive" SET DEFAULT true;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "registrationId",
ADD COLUMN     "currentLevelId" TEXT,
ADD COLUMN     "currentSessionId" TEXT,
ADD COLUMN     "previousBalance" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
ADD COLUMN     "registrationNumber" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "studentId",
ADD COLUMN     "studentProfileId" TEXT;

-- AlterTable
ALTER TABLE "level" ALTER COLUMN "coast" SET DATA TYPE DECIMAL(65,30);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "commissionRate" DECIMAL(65,30) NOT NULL DEFAULT 0.05,
    "commissionAmount" DECIMAL(65,30) NOT NULL,
    "netAmount" DECIMAL(65,30) NOT NULL,
    "transactionRef" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_registrationNumber_key" ON "Student"("registrationNumber");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_currentLevelId_fkey" FOREIGN KEY ("currentLevelId") REFERENCES "level"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_currentSessionId_fkey" FOREIGN KEY ("currentSessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

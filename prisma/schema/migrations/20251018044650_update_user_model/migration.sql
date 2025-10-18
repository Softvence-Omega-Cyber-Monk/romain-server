/*
  Warnings:

  - You are about to drop the column `fullName` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `phone` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'GENERAL_MANAGER', 'ADMIN_DIRECTOR', 'ACCOUNTANT', 'STUDENT');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "fullName",
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "phone" TEXT NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "SystemRole" NOT NULL DEFAULT 'STUDENT';

-- DropEnum
DROP TYPE "Role";

/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('FR', 'EN', 'KM');

-- AlterTable
ALTER TABLE "Family" ADD COLUMN     "language" "Locale" NOT NULL DEFAULT 'FR';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

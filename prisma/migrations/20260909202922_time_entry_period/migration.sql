/*
  Warnings:

  - A unique constraint covering the columns `[nannyId,workDate,period]` on the table `TimeEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TimeEntryPeriod" AS ENUM ('MORNING', 'AFTERNOON');

-- DropIndex
DROP INDEX "TimeEntry_nannyId_workDate_key";

-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN     "period" "TimeEntryPeriod" NOT NULL DEFAULT 'MORNING';

-- CreateIndex
CREATE UNIQUE INDEX "TimeEntry_nannyId_workDate_period_key" ON "TimeEntry"("nannyId", "workDate", "period");

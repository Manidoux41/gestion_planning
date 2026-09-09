-- CreateEnum
CREATE TYPE "TimeEntryStatus" AS ENUM ('PENDING', 'VALIDATED');

-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN     "status" "TimeEntryStatus" NOT NULL DEFAULT 'PENDING';

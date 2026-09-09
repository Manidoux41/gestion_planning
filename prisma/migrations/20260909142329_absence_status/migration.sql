-- CreateEnum
CREATE TYPE "AbsenceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Absence" ADD COLUMN     "status" "AbsenceRequestStatus" NOT NULL DEFAULT 'PENDING';

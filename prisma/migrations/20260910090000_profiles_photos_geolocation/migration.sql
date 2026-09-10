-- AlterTable
ALTER TABLE "Family" ADD COLUMN     "idDocument" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "Nanny" ADD COLUMN     "idDocument" TEXT,
ADD COLUMN     "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "rescheduledCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LawyerProfile" ADD COLUMN     "idDocKey" TEXT,
ADD COLUMN     "licenseDocKey" TEXT;

-- AlterTable
ALTER TABLE "ConsultSession" ADD COLUMN     "egressId" TEXT,
ADD COLUMN     "recordingKey" TEXT,
ADD COLUMN     "recordingStartedAt" TIMESTAMP(3);

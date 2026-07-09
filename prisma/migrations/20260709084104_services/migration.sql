-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('VIDEO', 'AUDIO', 'WRITTEN', 'DOC_REVIEW');

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "type" "ServiceType" NOT NULL,
    "durationMin" INTEGER,
    "priceQepik" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Service_lawyerId_idx" ON "Service"("lawyerId");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "LawyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

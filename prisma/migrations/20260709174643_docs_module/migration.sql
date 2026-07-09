/*
  Warnings:

  - A unique constraint covering the columns `[docOrderId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DocOrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "docOrderId" TEXT,
ALTER COLUMN "bookingId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "DocTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleAz" TEXT NOT NULL,
    "descriptionAz" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priceQepik" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "bodyText" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "answersEncrypted" TEXT NOT NULL,
    "status" "DocOrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "priceQepik" INTEGER NOT NULL,
    "docUid" TEXT NOT NULL,
    "pdfKey" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocTemplate_slug_key" ON "DocTemplate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateVersion_templateId_version_key" ON "TemplateVersion"("templateId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "DocOrder_docUid_key" ON "DocOrder"("docUid");

-- CreateIndex
CREATE INDEX "DocOrder_userId_createdAt_idx" ON "DocOrder"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_docOrderId_key" ON "Payment"("docOrderId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_docOrderId_fkey" FOREIGN KEY ("docOrderId") REFERENCES "DocOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateVersion" ADD CONSTRAINT "TemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocOrder" ADD CONSTRAINT "DocOrder_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "TemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ConsultSession" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "roomName" TEXT NOT NULL,
    "consentClientAt" TIMESTAMP(3),
    "consentLawyerAt" TIMESTAMP(3),
    "clientJoinedAt" TIMESTAMP(3),
    "lawyerJoinedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsultSession_bookingId_key" ON "ConsultSession"("bookingId");

-- AddForeignKey
ALTER TABLE "ConsultSession" ADD CONSTRAINT "ConsultSession_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

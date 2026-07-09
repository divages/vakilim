-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "reminded1At" TIMESTAMP(3),
ADD COLUMN     "reminded24At" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN     "overdueNotifiedAt" TIMESTAMP(3);

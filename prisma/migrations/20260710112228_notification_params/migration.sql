-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "params" JSONB,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "body" DROP NOT NULL;

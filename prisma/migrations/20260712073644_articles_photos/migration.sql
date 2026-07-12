-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "authorLawyerId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "photoKey" TEXT;

-- CreateIndex
CREATE INDEX "Post_authorLawyerId_idx" ON "Post"("authorLawyerId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorLawyerId_fkey" FOREIGN KEY ("authorLawyerId") REFERENCES "LawyerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

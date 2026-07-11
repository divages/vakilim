-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "practiceAreaSlug" TEXT;

-- AlterTable
ALTER TABLE "QaEntry" ADD COLUMN     "practiceAreaSlug" TEXT;

-- CreateIndex
CREATE INDEX "Post_practiceAreaSlug_idx" ON "Post"("practiceAreaSlug");

-- CreateIndex
CREATE INDEX "QaEntry_practiceAreaSlug_idx" ON "QaEntry"("practiceAreaSlug");

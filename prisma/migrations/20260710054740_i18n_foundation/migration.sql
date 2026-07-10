-- i18n foundation: renames preserve data; Prisma would have dropped these columns.
ALTER TABLE "User" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'az';
ALTER TABLE "PracticeArea" ADD COLUMN "nameRu" TEXT;
ALTER TABLE "LawyerProfile" RENAME COLUMN "bio" TO "bioAz";
ALTER TABLE "LawyerProfile" ADD COLUMN "bioRu" TEXT;
ALTER TABLE "LawyerProfile" ADD COLUMN "bioEn" TEXT;
ALTER TABLE "DocTemplate" RENAME COLUMN "titleAz" TO "title";
ALTER TABLE "DocTemplate" RENAME COLUMN "descriptionAz" TO "description";
ALTER TABLE "DocTemplate" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'az';
ALTER TABLE "DocTemplate" ADD COLUMN "familyKey" TEXT;

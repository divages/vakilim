-- CreateEnum
CREATE TYPE "PostKind" AS ENUM ('BLOG', 'NEWS');

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "kind" "PostKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "titleAz" TEXT NOT NULL,
    "titleRu" TEXT,
    "titleEn" TEXT,
    "excerptAz" TEXT NOT NULL,
    "excerptRu" TEXT,
    "excerptEn" TEXT,
    "bodyAz" TEXT NOT NULL,
    "bodyRu" TEXT,
    "bodyEn" TEXT,
    "coverUrl" TEXT,
    "authorName" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE INDEX "Post_kind_publishedAt_idx" ON "Post"("kind", "publishedAt");

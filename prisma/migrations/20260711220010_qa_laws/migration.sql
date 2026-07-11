-- CreateEnum
CREATE TYPE "LawKind" AS ENUM ('CODE', 'LAW');

-- CreateTable
CREATE TABLE "QaEntry" (
    "id" TEXT NOT NULL,
    "categoryAz" TEXT,
    "categoryRu" TEXT,
    "categoryEn" TEXT,
    "questionAz" TEXT NOT NULL,
    "questionRu" TEXT,
    "questionEn" TEXT,
    "answerAz" TEXT NOT NULL,
    "answerRu" TEXT,
    "answerEn" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QaEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawDoc" (
    "id" TEXT NOT NULL,
    "kind" "LawKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "titleAz" TEXT NOT NULL,
    "titleRu" TEXT,
    "titleEn" TEXT,
    "bodyAz" TEXT NOT NULL,
    "bodyRu" TEXT,
    "bodyEn" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawDoc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QaEntry_publishedAt_sortOrder_idx" ON "QaEntry"("publishedAt", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "LawDoc_slug_key" ON "LawDoc"("slug");

-- CreateIndex
CREATE INDEX "LawDoc_kind_sortOrder_idx" ON "LawDoc"("kind", "sortOrder");

import { prisma } from "@/lib/prisma";
import type { PostKind } from "@/generated/prisma/client";

export function pick(
  p: { titleAz: string; titleRu: string | null; titleEn: string | null },
  field: "title" | "excerpt" | "body",
  row: Record<string, unknown>,
  locale: string
): string {
  const az = row[`${field}Az`] as string;
  if (locale === "ru") return (row[`${field}Ru`] as string | null) ?? az;
  if (locale === "en") return (row[`${field}En`] as string | null) ?? az;
  return az;
}

export async function publishedPosts(kind: PostKind, page: number, per = 9) {
  const [rows, total] = await Promise.all([
    prisma.post.findMany({
      where: { kind, publishedAt: { not: null, lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * per,
      take: per,
    }),
    prisma.post.count({
      where: { kind, publishedAt: { not: null, lte: new Date() } },
    }),
  ]);
  return { rows, total, pages: Math.max(1, Math.ceil(total / per)) };
}

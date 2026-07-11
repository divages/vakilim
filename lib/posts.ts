import { prisma } from "@/lib/prisma";
import { pickL } from "@/lib/locale-pick";
import type { PostKind } from "@/generated/prisma/client";

export function pick<R extends Record<string, unknown>>(
  row: R,
  field: "title" | "excerpt" | "body",
  locale: string
): string {
  return pickL(row, field, locale);
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

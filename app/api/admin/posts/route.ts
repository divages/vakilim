import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const bodySchema = z.object({
  kind: z.enum(["BLOG", "NEWS"]),
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/),
  titleAz: z.string().min(3).max(160),
  titleRu: z.string().max(160).optional().nullable(),
  titleEn: z.string().max(160).optional().nullable(),
  excerptAz: z.string().min(3).max(400),
  excerptRu: z.string().max(400).optional().nullable(),
  excerptEn: z.string().max(400).optional().nullable(),
  bodyAz: z.string().min(10),
  bodyRu: z.string().optional().nullable(),
  bodyEn: z.string().optional().nullable(),
  coverUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
  authorName: z.string().max(80).optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN")
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  const d = parsed.data;
  const clash = await prisma.post.findUnique({ where: { slug: d.slug } });
  if (clash)
    return NextResponse.json({ ok: false, error: "SLUG_TAKEN" }, { status: 409 });
  const post = await prisma.post.create({
    data: { ...d, coverUrl: d.coverUrl || null },
  });
  return NextResponse.json({ ok: true, id: post.id });
}

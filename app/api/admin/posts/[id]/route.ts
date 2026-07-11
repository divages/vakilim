import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const patchSchema = z.object({
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/).optional(),
  titleAz: z.string().min(3).max(160).optional(),
  titleRu: z.string().max(160).nullable().optional(),
  titleEn: z.string().max(160).nullable().optional(),
  excerptAz: z.string().min(3).max(400).optional(),
  excerptRu: z.string().max(400).nullable().optional(),
  excerptEn: z.string().max(400).nullable().optional(),
  bodyAz: z.string().min(10).optional(),
  bodyRu: z.string().nullable().optional(),
  bodyEn: z.string().nullable().optional(),
  coverUrl: z.string().url().max(500).nullable().optional().or(z.literal("")),
  authorName: z.string().max(80).nullable().optional(),
  practiceAreaSlug: z.string().max(80).nullable().optional().or(z.literal("")),
  published: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN")
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  const { published, coverUrl, practiceAreaSlug, ...rest } = parsed.data;
  await prisma.post.update({
    where: { id },
    data: {
      ...rest,
      ...(coverUrl !== undefined ? { coverUrl: coverUrl || null } : {}),
      ...(practiceAreaSlug !== undefined
        ? { practiceAreaSlug: practiceAreaSlug || null }
        : {}),
      ...(published !== undefined
        ? { publishedAt: published ? new Date() : null }
        : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN")
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const { id } = await params;
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

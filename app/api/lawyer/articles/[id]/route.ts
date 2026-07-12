import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const patchSchema = z.object({
  titleAz: z.string().min(3).max(160).optional(),
  titleRu: z.string().max(160).nullable().optional(),
  titleEn: z.string().max(160).nullable().optional(),
  excerptAz: z.string().min(3).max(400).optional(),
  excerptRu: z.string().max(400).nullable().optional(),
  excerptEn: z.string().max(400).nullable().optional(),
  bodyAz: z.string().min(50).optional(),
  bodyRu: z.string().nullable().optional(),
  bodyEn: z.string().nullable().optional(),
  practiceAreaSlug: z.string().max(80).nullable().optional(),
});

async function ownDraft(userId: string, id: string) {
  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return null;
  const post = await prisma.post.findFirst({
    where: { id, authorLawyerId: profile.id },
    select: { id: true, publishedAt: true },
  });
  if (!post || post.publishedAt) return null;
  return post;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkRateLimit(req, "lart", 30, 60 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  const post = await ownDraft(user.id, id);
  if (!post)
    return NextResponse.json({ ok: false, error: "NOT_EDITABLE" }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  const data = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v === "" ? null : v])
  );
  await prisma.post.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkRateLimit(req, "lart", 30, 60 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  const post = await ownDraft(user.id, id);
  if (!post)
    return NextResponse.json({ ok: false, error: "NOT_EDITABLE" }, { status: 403 });
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

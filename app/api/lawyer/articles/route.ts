import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/),
  titleAz: z.string().min(3).max(160),
  titleRu: z.string().max(160).optional().nullable().or(z.literal("")),
  titleEn: z.string().max(160).optional().nullable().or(z.literal("")),
  excerptAz: z.string().min(3).max(400),
  excerptRu: z.string().max(400).optional().nullable().or(z.literal("")),
  excerptEn: z.string().max(400).optional().nullable().or(z.literal("")),
  bodyAz: z.string().min(50),
  bodyRu: z.string().optional().nullable().or(z.literal("")),
  bodyEn: z.string().optional().nullable().or(z.literal("")),
  practiceAreaSlug: z.string().max(80).optional().nullable().or(z.literal("")),
});

export async function POST(req: Request) {
  if (!checkRateLimit(req, "lart", 10, 60 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, verificationStatus: true },
  });
  if (profile?.verificationStatus !== "APPROVED")
    return NextResponse.json({ ok: false, error: "NOT_APPROVED" }, { status: 403 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  const d = parsed.data;
  const clash = await prisma.post.findUnique({ where: { slug: d.slug } });
  if (clash)
    return NextResponse.json({ ok: false, error: "SLUG_TAKEN" }, { status: 409 });
  const cleaned = Object.fromEntries(
    Object.entries(d).map(([k, v]) => [k, v === "" ? null : v])
  ) as typeof d;
  const post = await prisma.post.create({
    data: {
      ...cleaned,
      kind: "BLOG",
      authorLawyerId: profile.id,
      authorName: user.fullName ?? null,
      publishedAt: null,
    },
  });
  return NextResponse.json({ ok: true, id: post.id });
}

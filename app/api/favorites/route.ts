import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({ lawyerProfileId: z.string().min(1) });

export async function POST(req: Request) {
  if (!checkRateLimit(req, "fav", 30, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  if (user.role !== "CLIENT")
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const { lawyerProfileId } = parsed.data;
  const profile = await prisma.lawyerProfile.findFirst({
    where: { id: lawyerProfileId, verificationStatus: "APPROVED" },
    select: { id: true },
  });
  if (!profile)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const existing = await prisma.favorite.findUnique({
    where: { userId_lawyerProfileId: { userId: user.id, lawyerProfileId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, favorited: false });
  }
  await prisma.favorite.create({ data: { userId: user.id, lawyerProfileId } });
  return NextResponse.json({ ok: true, favorited: true });
}

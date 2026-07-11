import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const bodySchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    startMin: z.coerce.number().int().min(0).max(1435),
    endMin: z.coerce.number().int().min(5).max(1440),
  })
  .refine((v) => v.startMin % 5 === 0 && v.endMin % 5 === 0, {
    message: "5-minute steps",
  })
  .refine((v) => v.endMin - v.startMin >= 15, { message: "too short" });

export async function POST(req: Request) {
  if (!checkRateLimit(req, "avail", 20, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile)
    return NextResponse.json({ ok: false, error: "NO_PROFILE" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const { weekday, startMin, endMin } = parsed.data;

  const sameDay = await prisma.availabilityRule.findMany({
    where: { lawyerId: profile.id, weekday },
    select: { startMin: true, endMin: true },
  });
  const overlaps = sameDay.some(
    (r) => startMin < r.endMin && endMin > r.startMin
  );
  if (overlaps)
    return NextResponse.json({ ok: false, error: "OVERLAP" }, { status: 409 });

  const rule = await prisma.availabilityRule.create({
    data: { lawyerId: profile.id, weekday, startMin, endMin },
  });

  return NextResponse.json({ ok: true, id: rule.id });
}

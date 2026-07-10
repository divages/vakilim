import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canReview } from "@/lib/disputes";
import { notifyUser } from "@/lib/notify";
import { checkRateLimit } from "@/lib/rate-limit";

const ALLOWED_TAGS = ["clear", "on_time", "solved", "professional"] as const;

const bodySchema = z.object({
  stars: z.coerce.number().int().min(1).max(5),
  tags: z.array(z.enum(ALLOWED_TAGS)).max(4).default([]),
  text: z.string().trim().max(1000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkRateLimit(req, "review", 5, 10 * 60_000))
    return NextResponse.json(
      { ok: false, error: "TOO_MANY_REQUESTS" },
      { status: 429 }
    );
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { payment: true, review: true, lawyer: { select: { userId: true, slug: true } } },
  });
  if (!booking || booking.clientId !== user.id)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (!canReview(booking.status) || !booking.payment)
    return NextResponse.json({ ok: false, error: "NOT_ELIGIBLE" }, { status: 409 });
  if (booking.review)
    return NextResponse.json({ ok: false, error: "ALREADY_REVIEWED" }, { status: 409 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  await prisma.review.create({
    data: {
      bookingId: booking.id,
      lawyerId: booking.lawyerId,
      clientId: user.id,
      stars: parsed.data.stars,
      tags: parsed.data.tags,
      text: parsed.data.text || null,
    },
  });

  await notifyUser(booking.lawyer.userId, {
    type: "NEW_REVIEW",
    params: { stars: "★".repeat(parsed.data.stars) },
    link: booking.lawyer.slug ? `/lawyers/${booking.lawyer.slug}` : "/lawyers",
  });

  return NextResponse.json({ ok: true });
}

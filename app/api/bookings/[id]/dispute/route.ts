import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canOpenDispute } from "@/lib/disputes";

const REASONS = ["no_show", "technical", "quality", "other"] as const;

const bodySchema = z.object({
  reason: z.enum(REASONS),
  description: z.string().trim().min(10).max(2000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { dispute: true },
  });
  if (!booking || booking.clientId !== user.id)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (booking.dispute)
    return NextResponse.json({ ok: false, error: "ALREADY_OPEN" }, { status: 409 });
  if (!canOpenDispute(booking.status, booking.endAt))
    return NextResponse.json({ ok: false, error: "WINDOW_CLOSED" }, { status: 409 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  await prisma.dispute.create({
    data: {
      bookingId: booking.id,
      clientId: user.id,
      reason: parsed.data.reason,
      description: parsed.data.description,
    },
  });

  return NextResponse.json({ ok: true });
}

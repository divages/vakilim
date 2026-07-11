import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateSlots } from "@/lib/slots";
import { canReschedule } from "@/lib/reschedule";
import { notifyUser, whenLabel } from "@/lib/notify";
import { checkRateLimit } from "@/lib/rate-limit";

const ACTIVE_STATUSES = ["PENDING_PAYMENT", "REQUESTED", "CONFIRMED"] as const;
const DAYS = 14;

const bodySchema = z.object({ startAt: z.string().datetime() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkRateLimit(req, "resched", 10, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { lawyer: { select: { id: true, bufferMin: true, userId: true } } },
  });
  if (!booking || booking.clientId !== user.id)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const now = new Date();
  if (!canReschedule(booking.status, booking.startAt, booking.rescheduledCount, now)) {
    const limitHit = booking.rescheduledCount >= 1;
    return NextResponse.json(
      { ok: false, error: limitHit ? "LIMIT_REACHED" : "TOO_LATE" },
      { status: 409 }
    );
  }

  const [rules, busyRows] = await Promise.all([
    prisma.availabilityRule.findMany({
      where: { lawyerId: booking.lawyer.id },
      select: { weekday: true, startMin: true, endMin: true },
    }),
    prisma.booking.findMany({
      where: {
        lawyerId: booking.lawyer.id,
        status: { in: [...ACTIVE_STATUSES] },
        endAt: { gt: now },
      },
      select: { id: true, startAt: true, endAt: true },
    }),
  ]);

  // Exclude the booking's own current slot — otherwise it blocks itself.
  const busy = busyRows.filter((b) => b.id !== booking.id);

  const slots = generateSlots({
    rules,
    bufferMin: booking.lawyer.bufferMin,
    durationMin: booking.durationMin,
    days: DAYS,
    now,
    busy,
  });

  const requested = new Date(parsed.data.startAt);
  const match = slots.find((s) => s.startAt.getTime() === requested.getTime());
  if (!match)
    return NextResponse.json({ ok: false, error: "SLOT_TAKEN" }, { status: 409 });

  const oldLabel = whenLabel(booking.startAt);

  try {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        startAt: match.startAt,
        endAt: match.endAt,
        rescheduledCount: { increment: 1 },
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    )
      return NextResponse.json({ ok: false, error: "SLOT_TAKEN" }, { status: 409 });
    throw e;
  }

  await notifyUser(booking.lawyer.userId, {
    type: "BOOKING_RESCHEDULED",
    params: { from: oldLabel, to: whenLabel(match.startAt) },
    link: "/lawyer/bookings",
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateSlots } from "@/lib/slots";
import { checkRateLimit } from "@/lib/rate-limit";

const ACTIVE_STATUSES = ["PENDING_PAYMENT", "REQUESTED", "CONFIRMED"] as const;
const DAYS = 14;

const bodySchema = z.object({
  serviceId: z.string().min(1),
  startAt: z.string().datetime(),
});

export async function POST(req: Request) {
  if (!checkRateLimit(req, "book", 10, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const tenMinAgo = new Date(Date.now() - 10 * 60_000);
  const recentBookings = await prisma.booking.count({
    where: { clientId: user.id, createdAt: { gte: tenMinAgo } },
  });
  if (recentBookings >= 5)
    return NextResponse.json(
      { ok: false, error: "TOO_MANY_REQUESTS" },
      { status: 429 }
    );

  const service = await prisma.service.findFirst({
    where: {
      id: parsed.data.serviceId,
      active: true,
      type: { in: ["VIDEO", "AUDIO"] },
    },
    include: {
      lawyer: {
        select: { id: true, bufferMin: true, verificationStatus: true, userId: true },
      },
    },
  });
  if (
    !service ||
    !service.durationMin ||
    service.lawyer.verificationStatus !== "APPROVED"
  )
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  if (service.lawyer.userId === user.id)
    return NextResponse.json({ ok: false, error: "OWN_SERVICE" }, { status: 400 });

  const requestedStart = new Date(parsed.data.startAt);
  const now = new Date();

  const [rules, busyBookings] = await Promise.all([
    prisma.availabilityRule.findMany({
      where: { lawyerId: service.lawyer.id },
      select: { weekday: true, startMin: true, endMin: true },
    }),
    prisma.booking.findMany({
      where: {
        lawyerId: service.lawyer.id,
        status: { in: [...ACTIVE_STATUSES] },
        endAt: { gt: now },
      },
      select: { startAt: true, endAt: true },
    }),
  ]);

  const slots = generateSlots({
    rules,
    bufferMin: service.lawyer.bufferMin,
    durationMin: service.durationMin,
    days: DAYS,
    now,
    busy: busyBookings,
  });

  const match = slots.find(
    (s) => s.startAt.getTime() === requestedStart.getTime()
  );
  if (!match)
    return NextResponse.json({ ok: false, error: "SLOT_TAKEN" }, { status: 409 });

  try {
    const booking = await prisma.booking.create({
      data: {
        clientId: user.id,
        lawyerId: service.lawyer.id,
        serviceId: service.id,
        serviceType: service.type,
        durationMin: service.durationMin,
        priceQepik: service.priceQepik,
        startAt: match.startAt,
        endAt: match.endAt,
        status: "PENDING_PAYMENT",
      },
    });
    return NextResponse.json({ ok: true, id: booking.id });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      // Unique (lawyerId, startAt, activeSlotKey) fired: someone won the race.
      return NextResponse.json({ ok: false, error: "SLOT_TAKEN" }, { status: 409 });
    }
    throw e;
  }
}

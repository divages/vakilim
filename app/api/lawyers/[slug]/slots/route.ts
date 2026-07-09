import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlots } from "@/lib/slots";

const ACTIVE_STATUSES = ["PENDING_PAYMENT", "REQUESTED", "CONFIRMED"] as const;
const DAYS = 14;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const serviceId = new URL(req.url).searchParams.get("serviceId");
  if (!serviceId)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const profile = await prisma.lawyerProfile.findFirst({
    where: { slug, verificationStatus: "APPROVED" },
    select: { id: true, bufferMin: true },
  });
  if (!profile)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      lawyerId: profile.id,
      active: true,
      type: { in: ["VIDEO", "AUDIO"] },
    },
    select: { durationMin: true },
  });
  if (!service || !service.durationMin)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const now = new Date();
  const [rules, busyBookings] = await Promise.all([
    prisma.availabilityRule.findMany({
      where: { lawyerId: profile.id },
      select: { weekday: true, startMin: true, endMin: true },
    }),
    prisma.booking.findMany({
      where: {
        lawyerId: profile.id,
        status: { in: [...ACTIVE_STATUSES] },
        endAt: { gt: now },
      },
      select: { startAt: true, endAt: true },
    }),
  ]);

  const slots = generateSlots({
    rules,
    bufferMin: profile.bufferMin,
    durationMin: service.durationMin,
    days: DAYS,
    now,
    busy: busyBookings,
  });

  const byDay = new Map<
    string,
    { dateIso: string; weekday: number; slots: { label: string; startAt: string }[] }
  >();
  for (const s of slots) {
    const entry =
      byDay.get(s.dateIso) ?? { dateIso: s.dateIso, weekday: s.weekday, slots: [] };
    entry.slots.push({ label: s.label, startAt: s.startAt.toISOString() });
    byDay.set(s.dateIso, entry);
  }

  return NextResponse.json({ ok: true, days: [...byDay.values()] });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notifyUser, whenLabel } from "@/lib/notify";

const bodySchema = z.object({ bookingId: z.string().min(1) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { lawyer: { select: { bookingMode: true, userId: true } } },
  });
  if (!booking || booking.clientId !== user.id)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (booking.status !== "PENDING_PAYMENT")
    return NextResponse.json({ ok: false, error: "ALREADY_PAID" }, { status: 409 });

  const nextStatus =
    booking.lawyer.bookingMode === "INSTANT" ? "CONFIRMED" : "REQUESTED";

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: "MOCK",
        amountQepik: booking.priceQepik,
        status: "CAPTURED",
      },
    }),
    prisma.booking.update({
      where: { id: booking.id },
      data: { status: nextStatus },
    }),
  ]);

  const clientName = user.fullName || user.phone || "Müştəri";
  await notifyUser(booking.lawyer.userId, {
    type: nextStatus === "REQUESTED" ? "NEW_BOOKING_REQUEST" : "NEW_BOOKING",
    params: { client: clientName, when: whenLabel(booking.startAt) },
    link: "/lawyer/bookings",
  });

  return NextResponse.json({ ok: true, status: nextStatus });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cancellationRefund } from "@/lib/policy";

const CANCELLABLE = ["PENDING_PAYMENT", "REQUESTED", "CONFIRMED"] as const;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { payment: true },
  });
  if (!booking || booking.clientId !== user.id)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (!(CANCELLABLE as readonly string[]).includes(booking.status))
    return NextResponse.json({ ok: false, error: "INVALID_STATE" }, { status: 409 });

  const now = new Date();
  if (booking.startAt.getTime() <= now.getTime())
    return NextResponse.json({ ok: false, error: "TOO_LATE" }, { status: 409 });

  const { pct, refundQepik } = booking.payment
    ? cancellationRefund(booking.payment.amountQepik, booking.startAt, now)
    : { pct: 0 as const, refundQepik: 0 };

  await prisma.$transaction([
    prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED", activeSlotKey: null },
    }),
    ...(booking.payment && refundQepik > 0
      ? [
          prisma.payment.update({
            where: { id: booking.payment.id },
            data: {
              refundedQepik: { increment: refundQepik },
              status:
                refundQepik === booking.payment.amountQepik
                  ? "REFUNDED"
                  : "PARTIALLY_REFUNDED",
            },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true, pct, refundQepik });
}

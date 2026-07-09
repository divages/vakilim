import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notifyUser, money } from "@/lib/notify";

const bodySchema = z.object({
  resolution: z.enum(["FULL_REFUND", "PARTIAL_REFUND", "DISMISSED"]),
  refundQepik: z.coerce.number().int().min(1).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN")
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: { booking: { include: { payment: true, lawyer: { select: { userId: true } } } } },
  });
  if (!dispute)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (dispute.status === "RESOLVED")
    return NextResponse.json({ ok: false, error: "INVALID_STATE" }, { status: 409 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const payment = dispute.booking.payment;
  const remaining = payment ? payment.amountQepik - payment.refundedQepik : 0;

  let refund = 0;
  const { resolution } = parsed.data;
  if (resolution === "FULL_REFUND") {
    if (remaining <= 0)
      return NextResponse.json({ ok: false, error: "NOTHING_TO_REFUND" }, { status: 409 });
    refund = remaining;
  } else if (resolution === "PARTIAL_REFUND") {
    const requested = parsed.data.refundQepik ?? 0;
    if (requested < 1 || requested > remaining)
      return NextResponse.json({ ok: false, error: "INVALID_AMOUNT" }, { status: 400 });
    refund = requested;
  }

  await prisma.$transaction([
    prisma.dispute.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolution,
        refundQepik: refund,
        resolvedAt: new Date(),
      },
    }),
    ...(payment && refund > 0
      ? [
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              refundedQepik: { increment: refund },
              status:
                payment.refundedQepik + refund === payment.amountQepik
                  ? "REFUNDED"
                  : "PARTIALLY_REFUNDED",
            },
          }),
        ]
      : []),
  ]);

  const outcome =
    resolution === "DISMISSED"
      ? "Şikayət rədd edildi."
      : `Qərar: ${money(refund)} geri qaytarılır.`;
  await notifyUser(dispute.clientId, {
    type: "DISPUTE_RESOLVED",
    title: "Mübahisə həll olundu",
    body: outcome,
    link: "/bookings",
  });
  await notifyUser(dispute.booking.lawyer.userId, {
    type: "DISPUTE_RESOLVED",
    title: "Mübahisə həll olundu",
    body: outcome,
    link: "/lawyer/disputes",
  });

  return NextResponse.json({ ok: true, refundQepik: refund });
}

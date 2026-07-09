import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const bodySchema = z.object({ action: z.enum(["ACCEPT", "DECLINE"]) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { payment: true },
  });
  if (!booking || booking.lawyerId !== profile.id)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (booking.status !== "REQUESTED")
    return NextResponse.json({ ok: false, error: "INVALID_STATE" }, { status: 409 });

  if (parsed.data.action === "ACCEPT") {
    await prisma.booking.update({
      where: { id },
      data: { status: "CONFIRMED" },
    });
    return NextResponse.json({ ok: true, status: "CONFIRMED" });
  }

  // DECLINE: booking freed + automatic full refund (spec guarantee)
  await prisma.$transaction([
    prisma.booking.update({
      where: { id },
      data: { status: "DECLINED", activeSlotKey: null },
    }),
    ...(booking.payment
      ? [
          prisma.payment.update({
            where: { id: booking.payment.id },
            data: {
              status: "REFUNDED",
              refundedQepik: booking.payment.amountQepik,
            },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true, status: "DECLINED" });
}

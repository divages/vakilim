import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateAndStore } from "@/lib/docgen";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkRateLimit(_req, "docpay", 10, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const order = await prisma.docOrder.findUnique({ where: { id } });
  if (!order || order.userId !== user.id)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (order.status !== "PENDING_PAYMENT")
    return NextResponse.json({ ok: false, error: "ALREADY_PAID" }, { status: 409 });

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        docOrderId: order.id,
        provider: "MOCK",
        amountQepik: order.priceQepik,
        status: "CAPTURED",
      },
    }),
    prisma.docOrder.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: new Date() },
    }),
  ]);

  try {
    await generateAndStore(order.id);
  } catch (e) {
    console.error("Doc generation after payment failed:", e);
    // download route retries lazily — payment is never lost
  }

  return NextResponse.json({ ok: true });
}

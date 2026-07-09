import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { presignRecordingUrl } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const { id, messageId } = await params;

  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { lawyer: { select: { userId: true } } },
  });
  if (
    !booking ||
    (booking.clientId !== user.id && booking.lawyer.userId !== user.id)
  )
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const message = await prisma.message.findFirst({
    where: { id: messageId, bookingId: id, attachmentKey: { not: null } },
    select: { attachmentKey: true },
  });
  if (!message?.attachmentKey)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const url = await presignRecordingUrl(message.attachmentKey, 300);
  if (!url)
    return NextResponse.json({ ok: false, error: "SERVER_CONFIG" }, { status: 500 });

  return NextResponse.redirect(url);
}

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canMessage, isConversationVisible } from "@/lib/messaging";
import { detectContactInfo } from "@/lib/moderation";
import { uploadObject, s3Env } from "@/lib/storage";
import { notifyNewMessageThrottled } from "@/lib/notify";

const MAX_BODY = 2000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

async function loadParticipantBooking(id: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { lawyer: { select: { userId: true } } },
  });
  if (!booking) return null;
  if (booking.clientId !== userId && booking.lawyer.userId !== userId)
    return null;
  return booking;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const booking = await loadParticipantBooking(id, user.id);
  if (!booking || !isConversationVisible(booking.status))
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { bookingId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      senderId: true,
      body: true,
      attachmentName: true,
      attachmentKey: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    writable: canMessage(booking),
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      body: m.body,
      attachmentName: m.attachmentName,
      hasAttachment: !!m.attachmentKey,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const booking = await loadParticipantBooking(id, user.id);
  if (!booking || !isConversationVisible(booking.status))
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  if (!canMessage(booking))
    return NextResponse.json({ ok: false, error: "READ_ONLY" }, { status: 409 });

  const form = await req.formData().catch(() => null);
  if (!form)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const body = (form.get("body")?.toString() ?? "").trim().slice(0, MAX_BODY);
  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;

  if (!body && !hasFile)
    return NextResponse.json({ ok: false, error: "EMPTY" }, { status: 400 });

  let attachmentKey: string | null = null;
  let attachmentName: string | null = null;

  if (hasFile) {
    const f = file as File;
    if (f.size > MAX_FILE_BYTES)
      return NextResponse.json({ ok: false, error: "FILE_TOO_LARGE" }, { status: 400 });
    const ext = ALLOWED_TYPES[f.type];
    if (!ext)
      return NextResponse.json({ ok: false, error: "FILE_TYPE" }, { status: 400 });
    if (!s3Env())
      return NextResponse.json({ ok: false, error: "SERVER_CONFIG" }, { status: 500 });

    attachmentName = f.name.slice(0, 120) || `fayl.${ext}`;
    attachmentKey = `attachments/${booking.id}/${randomBytes(8).toString("hex")}.${ext}`;
    const buffer = Buffer.from(await f.arrayBuffer());
    await uploadObject(attachmentKey, buffer, f.type);
  }

  const reasons = body ? detectContactInfo(body) : [];

  const message = await prisma.message.create({
    data: {
      bookingId: booking.id,
      senderId: user.id,
      body,
      attachmentKey,
      attachmentName,
      flagged: reasons.length > 0,
      flagReasons: reasons,
    },
  });

  const recipientId =
    booking.clientId === user.id ? booking.lawyer.userId : booking.clientId;
  await notifyNewMessageThrottled(
    recipientId,
    user.fullName || user.phone || "İstifadəçi",
    booking.id
  );

  return NextResponse.json({ ok: true, id: message.id });
}

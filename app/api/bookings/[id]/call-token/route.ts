import { NextResponse } from "next/server";
import { z } from "zod";
import { AccessToken } from "livekit-server-sdk";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isJoinable } from "@/lib/call-window";

const bodySchema = z.object({ consent: z.literal(true) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const url = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!url || !apiKey || !apiSecret)
    return NextResponse.json({ ok: false, error: "SERVER_CONFIG" }, { status: 500 });

  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "CONSENT_REQUIRED" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { lawyer: { select: { userId: true } } },
  });
  if (!booking)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const isClient = booking.clientId === user.id;
  const isLawyer = booking.lawyer.userId === user.id;
  if (!isClient && !isLawyer)
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  if (booking.status !== "CONFIRMED")
    return NextResponse.json({ ok: false, error: "INVALID_STATE" }, { status: 409 });

  const now = new Date();
  if (!isJoinable(booking.startAt, booking.endAt, now)) {
    const early = now < booking.startAt;
    return NextResponse.json(
      { ok: false, error: early ? "TOO_EARLY" : "TOO_LATE" },
      { status: 409 }
    );
  }

  const roleFields = isClient
    ? { consentClientAt: now, clientJoinedAt: now }
    : { consentLawyerAt: now, lawyerJoinedAt: now };

  await prisma.consultSession.upsert({
    where: { bookingId: booking.id },
    create: { bookingId: booking.id, roomName: booking.id, ...roleFields },
    update: roleFields,
  });

  const at = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    name: user.fullName || user.phone || "İstifadəçi",
    ttl: "2h",
  });
  at.addGrant({ roomJoin: true, room: booking.id });
  const token = await at.toJwt();

  return NextResponse.json({ ok: true, token, url });
}

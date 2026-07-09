import { NextResponse } from "next/server";
import {
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  S3Upload,
} from "livekit-server-sdk";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isJoinable } from "@/lib/call-window";
import { s3Env } from "@/lib/storage";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const lkUrl = process.env.LIVEKIT_URL;
  const lkKey = process.env.LIVEKIT_API_KEY;
  const lkSecret = process.env.LIVEKIT_API_SECRET;
  const storage = s3Env();
  if (!lkUrl || !lkKey || !lkSecret || !storage)
    return NextResponse.json({ ok: false, error: "SERVER_CONFIG" }, { status: 500 });

  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { lawyer: { select: { userId: true } }, session: true },
  });
  if (!booking || !booking.session)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const isParticipant =
    booking.clientId === user.id || booking.lawyer.userId === user.id;
  if (!isParticipant)
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  if (booking.status !== "CONFIRMED" || !isJoinable(booking.startAt, booking.endAt))
    return NextResponse.json({ ok: false, error: "INVALID_STATE" }, { status: 409 });

  // Atomic claim: only the first caller proceeds to start egress.
  const claimed = await prisma.consultSession.updateMany({
    where: { bookingId: booking.id, egressId: null },
    data: { egressId: "starting", recordingStartedAt: new Date() },
  });
  if (claimed.count === 0)
    return NextResponse.json({ ok: true, started: false });

  const recordingKey = `recordings/${booking.id}.mp4`;

  try {
    const egress = new EgressClient(
      lkUrl.replace(/^wss/, "https").replace(/^ws/, "http"),
      lkKey,
      lkSecret
    );
    const info = await egress.startRoomCompositeEgress(
      booking.session.roomName,
      {
        file: new EncodedFileOutput({
          fileType: EncodedFileType.MP4,
          filepath: recordingKey,
          output: {
            case: "s3",
            value: new S3Upload({
              endpoint: storage.endpoint,
              region: storage.region,
              accessKey: storage.accessKeyId,
              secret: storage.secretAccessKey,
              bucket: storage.bucket,
              forcePathStyle: true,
            }),
          },
        }),
      },
      { layout: "speaker" }
    );

    await prisma.consultSession.update({
      where: { bookingId: booking.id },
      data: { egressId: info.egressId, recordingKey },
    });

    return NextResponse.json({ ok: true, started: true });
  } catch (e) {
    // Soft failure: release the claim so a retry (e.g. the other participant)
    // can attempt again. The consultation itself must never be blocked.
    await prisma.consultSession.update({
      where: { bookingId: booking.id },
      data: { egressId: null, recordingStartedAt: null },
    });
    console.error("Egress start failed:", e);
    return NextResponse.json(
      { ok: false, error: "RECORDING_FAILED" },
      { status: 502 }
    );
  }
}

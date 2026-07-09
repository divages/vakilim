import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { presignRecordingUrl } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ profileId: string; kind: string }> }
) {
  const { profileId, kind } = await params;

  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN")
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  const profile = await prisma.lawyerProfile.findUnique({
    where: { id: profileId },
    select: { licenseDocKey: true, idDocKey: true },
  });
  const key =
    kind === "license"
      ? profile?.licenseDocKey
      : kind === "id"
        ? profile?.idDocKey
        : null;
  if (!key)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const url = await presignRecordingUrl(key, 300);
  if (!url)
    return NextResponse.json({ ok: false, error: "SERVER_CONFIG" }, { status: 500 });

  return NextResponse.redirect(url);
}

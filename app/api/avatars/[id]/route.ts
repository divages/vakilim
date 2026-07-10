import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { presignRecordingUrl } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await prisma.lawyerProfile.findUnique({
    where: { id },
    select: { photoKey: true, verificationStatus: true },
  });
  if (!profile?.photoKey || profile.verificationStatus === "REJECTED")
    return new NextResponse(null, { status: 404 });
  const url = await presignRecordingUrl(profile.photoKey, 600);
  if (!url) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(url, {
    headers: { "Cache-Control": "private, max-age=300" },
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkRateLimit(_req, "avail", 30, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
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

  const rule = await prisma.availabilityRule.findUnique({ where: { id } });
  if (!rule || rule.lawyerId !== profile.id)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  await prisma.availabilityRule.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const bodySchema = z.object({ text: z.string().trim().min(5).max(500) });

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

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review || review.lawyerId !== profile.id)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (review.lawyerReply)
    return NextResponse.json({ ok: false, error: "ALREADY_REPLIED" }, { status: 409 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  await prisma.review.update({
    where: { id },
    data: { lawyerReply: parsed.data.text, repliedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

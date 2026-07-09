import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const bodySchema = z.object({ hidden: z.boolean() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN")
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  await prisma.review.update({
    where: { id },
    data: { hidden: parsed.data.hidden },
  });

  return NextResponse.json({ ok: true });
}

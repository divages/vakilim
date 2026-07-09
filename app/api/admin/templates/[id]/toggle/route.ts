import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const bodySchema = z.object({ active: z.boolean() });

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

  const template = await prisma.docTemplate.findUnique({ where: { id } });
  if (!template)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  await prisma.docTemplate.update({
    where: { id },
    data: { active: parsed.data.active },
  });

  return NextResponse.json({ ok: true });
}

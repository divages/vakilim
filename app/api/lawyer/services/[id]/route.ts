import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function ownedService(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "UNAUTHORIZED" as const, status: 401 };

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return { error: "NO_PROFILE" as const, status: 403 };

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service || service.lawyerId !== profile.id)
    return { error: "NOT_FOUND" as const, status: 404 };

  return { service };
}

const patchSchema = z.object({ active: z.boolean() });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const owned = await ownedService(id);
  if ("error" in owned)
    return NextResponse.json({ ok: false, error: owned.error }, { status: owned.status });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  await prisma.service.update({
    where: { id },
    data: { active: parsed.data.active },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const owned = await ownedService(id);
  if ("error" in owned)
    return NextResponse.json({ ok: false, error: owned.error }, { status: owned.status });

  await prisma.service.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

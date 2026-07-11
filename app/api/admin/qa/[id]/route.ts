import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const patchSchema = z
  .object({
  categoryAz: z.string().max(80).optional().nullable().or(z.literal("")),
  categoryRu: z.string().max(80).optional().nullable().or(z.literal("")),
  categoryEn: z.string().max(80).optional().nullable().or(z.literal("")),
  questionAz: z.string().min(5).max(300),
  questionRu: z.string().max(300).optional().nullable().or(z.literal("")),
  questionEn: z.string().max(300).optional().nullable().or(z.literal("")),
  answerAz: z.string().min(5),
  answerRu: z.string().optional().nullable().or(z.literal("")),
  answerEn: z.string().optional().nullable().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(9999).optional(),
    published: z.boolean().optional(),
  })
  .partial();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN")
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  const { published, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  for (const k of Object.keys(data)) if (data[k] === "") data[k] = null;
  if (published !== undefined) data.publishedAt = published ? new Date() : null;
  await prisma.qaEntry.update({ where: { id }, data: data as never });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN")
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const { id } = await params;
  await prisma.qaEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

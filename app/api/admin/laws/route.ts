import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const bodySchema = z.object({
  kind: z.enum(["CODE", "LAW"]),
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/),
  titleAz: z.string().min(3).max(200),
  titleRu: z.string().max(200).optional().nullable().or(z.literal("")),
  titleEn: z.string().max(200).optional().nullable().or(z.literal("")),
  bodyAz: z.string().min(10),
  bodyRu: z.string().optional().nullable().or(z.literal("")),
  bodyEn: z.string().optional().nullable().or(z.literal("")),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

function clean<T extends Record<string, unknown>>(d: T): T {
  const out = { ...d } as Record<string, unknown>;
  for (const k of Object.keys(out)) if (out[k] === "") out[k] = null;
  return out as T;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN")
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  const d = clean(parsed.data);
  const clash = await prisma.lawDoc.findUnique({ where: { slug: d.slug } });
  if (clash)
    return NextResponse.json({ ok: false, error: "SLUG_TAKEN" }, { status: 409 });
  const row = await prisma.lawDoc.create({ data: d });
  return NextResponse.json({ ok: true, id: row.id });
}

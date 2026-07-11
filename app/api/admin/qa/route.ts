import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const bodySchema = z.object({
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
  practiceAreaSlug: z.string().max(80).optional().nullable().or(z.literal("")),
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
  const row = await prisma.qaEntry.create({ data: d });
  return NextResponse.json({ ok: true, id: row.id });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { encryptJson } from "@/lib/crypto";
import { validateAnswers, type FieldDef } from "@/lib/doc-fields";
import { generateAndStore, newDocUid } from "@/lib/docgen";
import { checkRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  templateSlug: z.string().min(1),
  answers: z.record(z.string(), z.string()),
});

export async function POST(req: Request) {
  if (!checkRateLimit(req, "docorder", 10, 60 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const tenMinAgo = new Date(Date.now() - 10 * 60_000);
  const recentOrders = await prisma.docOrder.count({
    where: { userId: user.id, createdAt: { gte: tenMinAgo } },
  });
  if (recentOrders >= 5)
    return NextResponse.json(
      { ok: false, error: "TOO_MANY_REQUESTS" },
      { status: 429 }
    );

  const template = await prisma.docTemplate.findFirst({
    where: { slug: parsed.data.templateSlug, active: true },
    include: {
      versions: {
        where: { published: true },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });
  const version = template?.versions[0];
  if (!template || !version)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const fields = version.fields as unknown as FieldDef[];
  const validated = validateAnswers(fields, parsed.data.answers);
  if (!validated.ok)
    return NextResponse.json(
      { ok: false, error: "INVALID_FIELD", fieldKey: validated.fieldKey },
      { status: 400 }
    );

  const free = template.priceQepik === 0;

  const order = await prisma.docOrder.create({
    data: {
      userId: user.id,
      templateVersionId: version.id,
      answersEncrypted: encryptJson(validated.cleaned),
      priceQepik: template.priceQepik,
      docUid: newDocUid(),
      status: free ? "PAID" : "PENDING_PAYMENT",
      paidAt: free ? new Date() : null,
    },
  });

  if (free) {
    try {
      await generateAndStore(order.id);
    } catch (e) {
      console.error("Free doc generation failed:", e);
      // download route will retry lazily
    }
  }

  return NextResponse.json({ ok: true, id: order.id, free });
}

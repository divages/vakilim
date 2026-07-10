import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { validateTemplateContent } from "@/lib/template-authoring";

const fieldSchema = z
  .object({
    key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/),
    labelAz: z.string().trim().min(1).max(120),
    helpAz: z.string().trim().max(300).optional(),
    type: z.enum(["text", "textarea", "date", "number", "select"]),
    required: z.boolean(),
    options: z
      .array(z.object({ value: z.string().min(1), labelAz: z.string().min(1) }))
      .min(1)
      .optional(),
    placeholder: z.string().max(120).optional(),
  })
  .refine((f) => f.type !== "select" || (f.options?.length ?? 0) > 0, {
    message: "select needs options",
  });

const bodySchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).min(3).max(80),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  category: z.string().trim().min(2).max(60),
  priceAzn: z.coerce.number().int().min(0).max(10000),
  locale: z.enum(["az", "ru", "en"]).default("az"),
  familyKey: z
    .union([z.string().trim().regex(/^[a-z0-9-]+$/).min(2).max(60), z.literal("")])
    .optional(),
  bodyText: z.string().min(50).max(20000),
  fieldsJson: z.string().min(2),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN")
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  let fieldsRaw: unknown;
  try {
    fieldsRaw = JSON.parse(parsed.data.fieldsJson);
  } catch {
    return NextResponse.json({ ok: false, error: "FIELDS_JSON" }, { status: 400 });
  }
  const fields = z.array(fieldSchema).min(1).max(30).safeParse(fieldsRaw);
  if (!fields.success)
    return NextResponse.json({ ok: false, error: "FIELDS_INVALID" }, { status: 400 });

  const keys = fields.data.map((f) => f.key);
  if (new Set(keys).size !== keys.length)
    return NextResponse.json({ ok: false, error: "FIELDS_DUPLICATE" }, { status: 400 });

  const content = validateTemplateContent(parsed.data.bodyText, keys);
  if (!content.ok)
    return NextResponse.json(
      { ok: false, error: "PLACEHOLDER_UNKNOWN", unknown: content.unknown },
      { status: 400 }
    );

  const { slug, title, description, category, priceAzn, bodyText, locale } =
    parsed.data;
  const familyKey = parsed.data.familyKey || null;

  const template = await prisma.docTemplate.upsert({
    where: { slug },
    update: { title, description, category, priceQepik: priceAzn * 100, locale, familyKey },
    create: {
      slug,
      title,
      description,
      category,
      priceQepik: priceAzn * 100,
      locale,
      familyKey,
    },
  });

  const latest = await prisma.templateVersion.findFirst({
    where: { templateId: template.id },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const version = (latest?.version ?? 0) + 1;

  await prisma.templateVersion.create({
    data: {
      templateId: template.id,
      version,
      bodyText,
      fields: fields.data as object,
    },
  });

  return NextResponse.json({ ok: true, version, unused: content.unused });
}

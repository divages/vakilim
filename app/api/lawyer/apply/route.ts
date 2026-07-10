import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { slugify, randomSuffix } from "@/lib/slug";
import { uploadObject, s3Env } from "@/lib/storage";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const fieldsSchema = z.object({
  fullName: z.string().trim().min(3).max(100),
  type: z.enum(["ADVOCATE", "LICENSED_LAWYER"]),
  licenseNo: z.string().trim().min(2).max(50),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  city: z.string().trim().min(2).max(50),
  bioAz: z.string().trim().max(2000).optional(),
  bioRu: z.string().trim().max(2000).optional(),
  bioEn: z.string().trim().max(2000).optional(),
  languages: z.array(z.enum(["az", "ru", "en"])).min(1),
  practiceAreaIds: z.array(z.string().min(1)).min(1).max(5),
}).superRefine((d, ctx) => {
  const map = { az: d.bioAz, ru: d.bioRu, en: d.bioEn } as const;
  for (const l of d.languages) {
    if ((map[l] ?? "").trim().length < 20)
      ctx.addIssue({
        code: "custom",
        path: [`bio${l[0].toUpperCase()}${l.slice(1)}`],
        message: "bio required for claimed language",
      });
  }
});

function checkFile(v: FormDataEntryValue | null): { file: File; ext: string } | { error: string } {
  if (!(v instanceof File) || v.size === 0) return { error: "FILE_REQUIRED" };
  if (v.size > MAX_FILE_BYTES) return { error: "FILE_TOO_LARGE" };
  const ext = ALLOWED_TYPES[v.type];
  if (!ext) return { error: "FILE_TYPE" };
  return { file: v, ext };
}

export async function POST(req: Request) {
  if (!checkRateLimit(req, "apply", 3, 60 * 60_000))
    return NextResponse.json(
      { ok: false, error: "TOO_MANY_REQUESTS" },
      { status: 429 }
    );
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  if (!s3Env())
    return NextResponse.json({ ok: false, error: "SERVER_CONFIG" }, { status: 500 });

  const form = await req.formData().catch(() => null);
  if (!form)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const parsed = fieldsSchema.safeParse({
    fullName: form.get("fullName"),
    type: form.get("type"),
    licenseNo: form.get("licenseNo"),
    yearsExperience: form.get("yearsExperience"),
    city: form.get("city"),
    bioAz: form.get("bioAz") ?? undefined,
    bioRu: form.get("bioRu") ?? undefined,
    bioEn: form.get("bioEn") ?? undefined,
    languages: form.getAll("languages"),
    practiceAreaIds: form.getAll("practiceAreaIds"),
  });
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const licenseDoc = checkFile(form.get("licenseDoc"));
  if ("error" in licenseDoc)
    return NextResponse.json({ ok: false, error: licenseDoc.error }, { status: 400 });
  const idDoc = checkFile(form.get("idDoc"));
  if ("error" in idDoc)
    return NextResponse.json({ ok: false, error: idDoc.error }, { status: 400 });

  const existing = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
  });
  if (existing)
    return NextResponse.json({ ok: false, error: "ALREADY_APPLIED" }, { status: 409 });

  const { practiceAreaIds, fullName, bioAz, bioRu, bioEn, ...profile } = parsed.data;

  const areas = await prisma.practiceArea.findMany({
    where: { id: { in: practiceAreaIds } },
    select: { id: true },
  });
  if (areas.length !== practiceAreaIds.length)
    return NextResponse.json({ ok: false, error: "INVALID_AREAS" }, { status: 400 });

  const rand = randomBytes(6).toString("hex");
  const licenseDocKey = `verification/${user.id}/license-${rand}.${licenseDoc.ext}`;
  const idDocKey = `verification/${user.id}/id-${rand}.${idDoc.ext}`;

  await uploadObject(
    licenseDocKey,
    Buffer.from(await licenseDoc.file.arrayBuffer()),
    licenseDoc.file.type
  );
  await uploadObject(
    idDocKey,
    Buffer.from(await idDoc.file.arrayBuffer()),
    idDoc.file.type
  );

  const slug = `${slugify(fullName)}-${randomSuffix()}`;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { fullName, role: "LAWYER" },
    }),
    prisma.lawyerProfile.create({
      data: {
        userId: user.id,
        slug,
        type: profile.type,
        licenseNo: profile.licenseNo,
        licenseDocKey,
        idDocKey,
        yearsExperience: profile.yearsExperience,
        city: profile.city,
        bioAz: bioAz?.trim() || null,
        bioRu: bioRu?.trim() || null,
        bioEn: bioEn?.trim() || null,
        languages: profile.languages,
        practiceAreas: {
          create: practiceAreaIds.map((practiceAreaId) => ({ practiceAreaId })),
        },
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

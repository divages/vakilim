import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const bodySchema = z.object({
  fullName: z.string().trim().min(3).max(100),
  type: z.enum(["ADVOCATE", "LICENSED_LAWYER"]),
  licenseNo: z.string().trim().min(2).max(50),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  city: z.string().trim().min(2).max(50),
  bio: z.string().trim().min(20).max(2000),
  languages: z.array(z.enum(["az", "ru", "en"])).min(1),
  practiceAreaIds: z.array(z.string().min(1)).min(1).max(5),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const existing = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
  });
  if (existing)
    return NextResponse.json({ ok: false, error: "ALREADY_APPLIED" }, { status: 409 });

  const { practiceAreaIds, fullName, ...profile } = parsed.data;

  const areas = await prisma.practiceArea.findMany({
    where: { id: { in: practiceAreaIds } },
    select: { id: true },
  });
  if (areas.length !== practiceAreaIds.length)
    return NextResponse.json({ ok: false, error: "INVALID_AREAS" }, { status: 400 });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { fullName, role: "LAWYER" },
    }),
    prisma.lawyerProfile.create({
      data: {
        userId: user.id,
        type: profile.type,
        licenseNo: profile.licenseNo,
        yearsExperience: profile.yearsExperience,
        city: profile.city,
        bio: profile.bio,
        languages: profile.languages,
        practiceAreas: {
          create: practiceAreaIds.map((practiceAreaId) => ({ practiceAreaId })),
        },
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

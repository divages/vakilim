import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const CALL_TYPES = ["VIDEO", "AUDIO"] as const;
const DURATIONS = [15, 30, 60] as const;
const MAX_SERVICES = 20;

const bodySchema = z.object({
  type: z.enum(["VIDEO", "AUDIO", "WRITTEN", "DOC_REVIEW"]),
  priceAzn: z.coerce.number().int().min(1).max(10000),
  durationMin: z.coerce.number().int().optional(),
});

export async function POST(req: Request) {
  if (!checkRateLimit(req, "svc", 20, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile)
    return NextResponse.json({ ok: false, error: "NO_PROFILE" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const { type, priceAzn, durationMin } = parsed.data;

  const isCall = (CALL_TYPES as readonly string[]).includes(type);
  if (isCall && !DURATIONS.includes(durationMin as (typeof DURATIONS)[number]))
    return NextResponse.json({ ok: false, error: "INVALID_DURATION" }, { status: 400 });
  if (!isCall && durationMin !== undefined)
    return NextResponse.json({ ok: false, error: "INVALID_DURATION" }, { status: 400 });

  const count = await prisma.service.count({ where: { lawyerId: profile.id } });
  if (count >= MAX_SERVICES)
    return NextResponse.json(
      { ok: false, error: "TOO_MANY_SERVICES" },
      { status: 400 }
    );

  const service = await prisma.service.create({
    data: {
      lawyerId: profile.id,
      type,
      durationMin: isCall ? (durationMin as number) : null,
      priceQepik: priceAzn * 100,
    },
  });

  return NextResponse.json({ ok: true, id: service.id });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  fullName: z.string().trim().min(3).max(100),
  email: z
    .union([z.string().trim().email().max(120), z.literal("")])
    .optional(),
});

export async function PATCH(req: Request) {
  if (!checkRateLimit(req, "me", 15, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const email = parsed.data.email ? parsed.data.email : null;

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { fullName: parsed.data.fullName, email },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    )
      return NextResponse.json({ ok: false, error: "EMAIL_TAKEN" }, { status: 409 });
    throw e;
  }

  return NextResponse.json({ ok: true });
}

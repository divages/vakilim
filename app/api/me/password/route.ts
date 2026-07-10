import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashPassword, verifyPassword } from "@/lib/password";

const bodySchema = z.object({
  current: z.string().optional(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  if (!checkRateLimit(req, "password", 10, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  if (user.passwordHash) {
    const okCurrent =
      parsed.data.current &&
      (await verifyPassword(parsed.data.current, user.passwordHash));
    if (!okCurrent)
      return NextResponse.json({ ok: false, error: "WRONG_PASSWORD" }, { status: 403 });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });
  return NextResponse.json({ ok: true });
}

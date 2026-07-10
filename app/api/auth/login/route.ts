import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/password";
import { createSession, sessionCookie } from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  locale: z.enum(["az", "ru", "en"]).optional(),
});

export async function POST(req: Request) {
  if (!checkRateLimit(req, "login", 10, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user?.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash)))
    // One uniform message — never reveal which half was wrong.
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  if (!user.emailVerifiedAt)
    return NextResponse.json({ ok: false, error: "EMAIL_NOT_VERIFIED" }, { status: 403 });

  // L3 seam: when user.twoFactorEnabled, branch to an OTP step here.

  const { token, expiresAt } = await createSession(user.id);
  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, phone: user.phone, role: user.role, fullName: user.fullName },
  });
  res.cookies.set(sessionCookie(token, expiresAt));
  return res;
}

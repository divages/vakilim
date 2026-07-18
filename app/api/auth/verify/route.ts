import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone-intl";
import { hashOtp, createSession, sessionCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({ phone: z.string(), code: z.string().length(6) });
const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  // SECURITY (audit §1.3): this is the only session-minting endpoint that had
  // no IP rate limit. Add one.
  if (!checkRateLimit(req, "verify", 10, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const phone = normalizePhone(parsed.data.phone);
  if (!phone)
    return NextResponse.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });

  // SECURITY (audit §1.3): passwordless phone-OTP must not be a bypass around
  // the password + 2FA gate that /login enforces. If an account already exists
  // for this phone and is an admin or has 2FA enabled, refuse — those accounts
  // must authenticate through /login (+ /login-2fa). New phones (no account
  // yet) are unaffected: a freshly created user is a CLIENT with 2FA off.
  const existingUser = await prisma.user.findUnique({
    where: { phone },
    select: { role: true, twoFactorEnabled: true },
  });
  if (existingUser && (existingUser.role === "ADMIN" || existingUser.twoFactorEnabled))
    return NextResponse.json(
      { ok: false, error: "USE_PASSWORD_LOGIN" },
      { status: 403 }
    );

  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp)
    return NextResponse.json({ ok: false, error: "CODE_EXPIRED" }, { status: 400 });
  if (otp.attempts >= MAX_ATTEMPTS)
    return NextResponse.json({ ok: false, error: "TOO_MANY_ATTEMPTS" }, { status: 429 });

  if (otp.codeHash !== hashOtp(parsed.data.code, phone)) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ ok: false, error: "WRONG_CODE" }, { status: 400 });
  }

  const [, user] = await prisma.$transaction([
    prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
    prisma.user.upsert({
      where: { phone },
      update: { phoneVerifiedAt: new Date() },
      create: { phone, phoneVerifiedAt: new Date() },
    }),
  ]);

  const { token, expiresAt } = await createSession(user.id);
  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, phone: user.phone, role: user.role, fullName: user.fullName },
  });
  res.cookies.set(sessionCookie(token, expiresAt));
  return res;
}

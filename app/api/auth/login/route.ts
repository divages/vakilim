import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/password";
import { createSession, sessionCookie, generateOtp, hashOtp } from "@/lib/auth";
import { sendOtp } from "@/lib/otp-transport";

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

  if (user.role === "ADMIN" && !user.phone)
    // Admin password login without a provable phone is refused outright.
    return NextResponse.json(
      { ok: false, error: "ADMIN_PHONE_REQUIRED" },
      { status: 403 }
    );
  if ((user.twoFactorEnabled || user.role === "ADMIN") && user.phone) {
    const code = generateOtp();
    await prisma.otpCode.create({
      data: {
        phone: user.phone,
        codeHash: hashOtp(code, user.phone),
        expiresAt: new Date(Date.now() + 5 * 60_000),
      },
    });
    await sendOtp(user.phone, code, parsed.data.locale ?? user.locale);
    const devCode = process.env.OTP_DEV_ECHO === "true" ? code : undefined;
    const masked = user.phone.slice(0, 4) + "•••" + user.phone.slice(-4);
    return NextResponse.json({
      ok: true,
      twoFactor: true,
      phoneMasked: masked,
      ...(devCode ? { devCode } : {}),
    });
  }

  const { token, expiresAt } = await createSession(user.id);
  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, phone: user.phone, role: user.role, fullName: user.fullName },
  });
  res.cookies.set(sessionCookie(token, expiresAt));
  return res;
}

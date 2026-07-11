import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, generateOtp, hashOtp } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendOtp } from "@/lib/otp-transport";
import { verifyPassword } from "@/lib/password";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }),
  z.object({ action: z.literal("enable"), code: z.string().length(6) }),
  z.object({ action: z.literal("disable"), password: z.string().optional() }),
]);
const OTP_TTL_MIN = 5;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  if (!checkRateLimit(req, "2fa", 10, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  const body = parsed.data;

  if (body.action === "start") {
    if (!user.phone)
      return NextResponse.json({ ok: false, error: "NO_PHONE" }, { status: 400 });
    const code = generateOtp();
    await prisma.otpCode.create({
      data: {
        phone: user.phone,
        codeHash: hashOtp(code, user.phone),
        expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60_000),
      },
    });
    await sendOtp(user.phone, code, user.locale);
    const devCode = process.env.OTP_DEV_ECHO === "true" ? code : undefined;
    return NextResponse.json({ ok: true, ...(devCode ? { devCode } : {}) });
  }

  if (body.action === "enable") {
    if (!user.phone)
      return NextResponse.json({ ok: false, error: "NO_PHONE" }, { status: 400 });
    const otp = await prisma.otpCode.findFirst({
      where: { phone: user.phone, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!otp || otp.codeHash !== hashOtp(body.code, user.phone))
      return NextResponse.json({ ok: false, error: "WRONG_CODE" }, { status: 400 });
    await prisma.$transaction([
      prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
      prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: true, phoneVerifiedAt: new Date() },
      }),
    ]);
    return NextResponse.json({ ok: true, enabled: true });
  }

  // disable — password-gated when a password exists
  if (user.passwordHash) {
    const okPw =
      body.password && (await verifyPassword(body.password, user.passwordHash));
    if (!okPw)
      return NextResponse.json({ ok: false, error: "WRONG_PASSWORD" }, { status: 403 });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false },
  });
  return NextResponse.json({ ok: true, enabled: false });
}

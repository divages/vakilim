import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, generateOtp, hashOtp } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendOtp } from "@/lib/otp-transport";
import { normalizePhone } from "@/lib/phone-intl";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), phone: z.string().min(7).max(20) }),
  z.object({
    action: z.literal("confirm"),
    phone: z.string().min(7).max(20),
    code: z.string().length(6),
  }),
]);

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  if (!checkRateLimit(req, "me-phone", 8, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  const phone = normalizePhone(parsed.data.phone);
  if (!phone)
    return NextResponse.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });

  const other = await prisma.user.findFirst({
    where: { phone, NOT: { id: user.id } },
    select: { id: true },
  });
  if (other)
    return NextResponse.json({ ok: false, error: "PHONE_TAKEN" }, { status: 409 });

  if (parsed.data.action === "start") {
    const code = generateOtp();
    await prisma.otpCode.create({
      data: {
        phone,
        codeHash: hashOtp(code, phone),
        expiresAt: new Date(Date.now() + 5 * 60_000),
      },
    });
    await sendOtp(phone, code, user.locale);
    const devCode = process.env.OTP_DEV_ECHO === "true" ? code : undefined;
    return NextResponse.json({ ok: true, ...(devCode ? { devCode } : {}) });
  }

  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.codeHash !== hashOtp(parsed.data.code, phone)) {
    if (otp)
      await prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
    return NextResponse.json({ ok: false, error: "WRONG_CODE" }, { status: 400 });
  }
  await prisma.$transaction([
    prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
    prisma.user.update({
      where: { id: user.id },
      data: { phone, phoneVerifiedAt: new Date() },
    }),
  ]);
  return NextResponse.json({ ok: true, phone });
}

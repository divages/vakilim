import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashOtp } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { normalizePhone } from "@/lib/phone-intl";
import { createEmailToken } from "@/lib/email-tokens";
import { sendEmail } from "@/lib/email";
import { renderAuthMail } from "@/lib/auth-mail";

const bodySchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().max(120),
  password: z.string().min(8).max(100),
  phone: z.string().min(7).max(20),
  code: z.string().length(6),
  locale: z.enum(["az", "ru", "en"]).default("az"),
});
const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  if (!checkRateLimit(req, "signup", 10, 60 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  const { fullName, email, password, locale } = parsed.data;
  const phone = normalizePhone(parsed.data.phone);
  if (!phone)
    return NextResponse.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });

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

  const clash = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
    select: { email: true },
  });
  if (clash)
    return NextResponse.json(
      { ok: false, error: clash.email === email ? "EMAIL_TAKEN" : "PHONE_TAKEN" },
      { status: 409 }
    );

  const [, user] = await prisma.$transaction([
    prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
    prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        locale,
        passwordHash: await hashPassword(password),
        phoneVerifiedAt: new Date(),
      },
    }),
  ]);

  const raw = await createEmailToken(user.id, "VERIFY", 60 * 24);
  const link = `https://vakilim.az/api/auth/verify-email?token=${raw}&locale=${locale}`;
  const mail = renderAuthMail("verify", locale, { link });
  const sent = await sendEmail({ to: email, subject: mail.subject, text: mail.text });
  const devLink =
    process.env.OTP_DEV_ECHO === "true"
      ? `/api/auth/verify-email?token=${raw}&locale=${locale}`
      : undefined;
  return NextResponse.json({ ok: true, ...(devLink ? { devLink } : {}), emailed: sent.ok });
}

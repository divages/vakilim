import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateOtp, hashOtp } from "@/lib/auth";
import { sendOtp } from "@/lib/otp-transport";
import { normalizePhone } from "@/lib/phone-intl";

const bodySchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().max(120),
  password: z.string().min(8).max(100),
  phone: z.string().min(7).max(20),
  locale: z.enum(["az", "ru", "en"]).default("az"),
});

export async function POST(req: Request) {
  if (!checkRateLimit(req, "signup", 5, 60 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  const phone = normalizePhone(parsed.data.phone);
  if (!phone)
    return NextResponse.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });

  const clash = await prisma.user.findFirst({
    where: { OR: [{ email: parsed.data.email }, { phone }] },
    select: { email: true },
  });
  if (clash)
    return NextResponse.json(
      { ok: false, error: clash.email === parsed.data.email ? "EMAIL_TAKEN" : "PHONE_TAKEN" },
      { status: 409 }
    );

  const code = generateOtp();
  await prisma.otpCode.create({
    data: {
      phone,
      codeHash: hashOtp(code, phone),
      expiresAt: new Date(Date.now() + 5 * 60_000),
    },
  });
  await sendOtp(phone, code, parsed.data.locale);
  const devCode = process.env.OTP_DEV_ECHO === "true" ? code : undefined;
  return NextResponse.json({ ok: true, phone, ...(devCode ? { devCode } : {}) });
}

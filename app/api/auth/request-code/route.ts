import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeAzPhone } from "@/lib/phone";
import { generateOtp, hashOtp } from "@/lib/auth";
import { sendOtpSms } from "@/lib/sms";

const bodySchema = z.object({ phone: z.string().min(7).max(20) });
const OTP_TTL_MIN = 5;
const MAX_CODES = 3;
const WINDOW_MIN = 15;

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const phone = normalizeAzPhone(parsed.data.phone);
  if (!phone)
    return NextResponse.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });

  const windowStart = new Date(Date.now() - WINDOW_MIN * 60 * 1000);
  const recent = await prisma.otpCode.count({
    where: { phone, createdAt: { gte: windowStart } },
  });
  if (recent >= MAX_CODES)
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });

  const code = generateOtp();
  await prisma.otpCode.create({
    data: {
      phone,
      codeHash: hashOtp(code, phone),
      expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60 * 1000),
    },
  });
  await sendOtpSms(phone, code);

  return NextResponse.json({ ok: true });
}
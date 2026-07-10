import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone-intl";
import { hashOtp, createSession, sessionCookie } from "@/lib/auth";

const bodySchema = z.object({ phone: z.string(), code: z.string().length(6) });
const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

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

  const [, user] = await prisma.$transaction([
    prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
    prisma.user.upsert({ where: { phone }, update: {}, create: { phone } }),
  ]);

  const { token, expiresAt } = await createSession(user.id);
  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, phone: user.phone, role: user.role, fullName: user.fullName },
  });
  res.cookies.set(sessionCookie(token, expiresAt));
  return res;
}

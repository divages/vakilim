import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/password";
import { createSession, sessionCookie, hashOtp } from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  code: z.string().length(6),
});
const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  if (!checkRateLimit(req, "login-2fa", 10, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (
    !user?.passwordHash ||
    !user.phone ||
    !(await verifyPassword(parsed.data.password, user.passwordHash))
  )
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });

  const otp = await prisma.otpCode.findFirst({
    where: { phone: user.phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp)
    return NextResponse.json({ ok: false, error: "CODE_EXPIRED" }, { status: 400 });
  if (otp.attempts >= MAX_ATTEMPTS)
    return NextResponse.json({ ok: false, error: "TOO_MANY_ATTEMPTS" }, { status: 429 });
  if (otp.codeHash !== hashOtp(parsed.data.code, user.phone)) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ ok: false, error: "WRONG_CODE" }, { status: 400 });
  }
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  const { token, expiresAt } = await createSession(user.id);
  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, phone: user.phone, role: user.role, fullName: user.fullName },
  });
  res.cookies.set(sessionCookie(token, expiresAt));
  return res;
}

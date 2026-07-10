import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/password";
import { createEmailToken } from "@/lib/email-tokens";
import { sendEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/phone-intl";
import { renderAuthMail } from "@/lib/auth-mail";

const bodySchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().max(120),
  password: z.string().min(8).max(100),
  phone: z.string().min(7).max(20).optional(),
  locale: z.enum(["az", "ru", "en"]).default("az"),
});

export async function POST(req: Request) {
  if (!checkRateLimit(req, "signup", 5, 60 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  const { fullName, email, password, locale } = parsed.data;

  let phone: string | null = null;
  if (parsed.data.phone) {
    phone = normalizePhone(parsed.data.phone);
    if (!phone)
      return NextResponse.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });
  }

  const clash = await prisma.user.findFirst({
    where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] },
    select: { id: true, email: true },
  });
  if (clash)
    return NextResponse.json(
      { ok: false, error: clash.email === email ? "EMAIL_TAKEN" : "PHONE_TAKEN" },
      { status: 409 }
    );

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      phone,
      locale,
      passwordHash: await hashPassword(password),
    },
  });

  const raw = await createEmailToken(user.id, "VERIFY", 60 * 24);
  const link = `https://vakilim.az/api/auth/verify-email?token=${raw}&locale=${locale}`;
  const mail = renderAuthMail("verify", locale, { link });
  const sent = await sendEmail({ to: email, subject: mail.subject, text: mail.text });

  const devLink = process.env.OTP_DEV_ECHO === "true" ? `/api/auth/verify-email?token=${raw}&locale=${locale}` : undefined;
  return NextResponse.json({ ok: true, ...(devLink ? { devLink } : {}), emailed: sent.ok });
}

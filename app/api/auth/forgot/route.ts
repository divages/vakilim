import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { createEmailToken } from "@/lib/email-tokens";
import { sendEmail } from "@/lib/email";
import { renderAuthMail } from "@/lib/auth-mail";

const bodySchema = z.object({
  email: z.string().email().max(120),
  locale: z.enum(["az", "ru", "en"]).default("az"),
});

export async function POST(req: Request) {
  if (!checkRateLimit(req, "forgot", 5, 60 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  const { email, locale } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  let devLink: string | undefined;
  if (user && user.passwordHash) {
    const raw = await createEmailToken(user.id, "RESET", 60);
    const link = `https://vakilim.az/${locale}/reset?token=${raw}`;
    const mail = renderAuthMail("reset", locale, { link });
    await sendEmail({ to: email, subject: mail.subject, text: mail.text });
    if (process.env.OTP_DEV_ECHO === "true")
      devLink = `/${locale}/reset?token=${raw}`;
  }
  // Same response whether or not the account exists.
  return NextResponse.json({ ok: true, ...(devLink ? { devLink } : {}) });
}

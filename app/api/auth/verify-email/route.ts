import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeEmailToken } from "@/lib/email-tokens";
import { createSession, sessionCookie } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const locale = ["az", "ru", "en"].includes(url.searchParams.get("locale") ?? "")
    ? url.searchParams.get("locale")!
    : "az";

  const userId = token ? await consumeEmailToken(token, "VERIFY") : null;
  if (!userId)
    return NextResponse.redirect(
      new URL(`/${locale}/login?verify=failed`, url.origin)
    );

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });

  // SECURITY (audit §2.1): resolve the post-verify redirect through safeNext.
  // The old guard (startsWith("/") && !startsWith("//")) is defeated by a
  // backslash — "/\evil.com" resolves to https://evil.com/ — and this link
  // arrives by email, is trusted, and mints a session before redirecting.
  const next = safeNext(url.searchParams.get("next"), `/${locale}/`);
  const { token: session, expiresAt } = await createSession(userId);
  const res = NextResponse.redirect(new URL(next, url.origin));
  res.cookies.set(sessionCookie(session, expiresAt));
  return res;
}

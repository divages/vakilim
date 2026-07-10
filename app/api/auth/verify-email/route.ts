import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeEmailToken } from "@/lib/email-tokens";
import { createSession, sessionCookie } from "@/lib/auth";

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
  const { token: session, expiresAt } = await createSession(userId);
  const res = NextResponse.redirect(new URL(`/${locale}/`, url.origin));
  res.cookies.set(sessionCookie(session, expiresAt));
  return res;
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, sessionCookie, getCurrentUser } from "@/lib/auth";

const STATE_COOKIE = "g_oauth";

function readState(req: Request): { state: string; next: string; locale: string } | null {
  const raw = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))
    ?.slice(STATE_COOKIE.length + 1);
  if (!raw) return null;
  try {
    const v = JSON.parse(decodeURIComponent(raw)) as {
      state?: string;
      next?: string;
      locale?: string;
    };
    if (!v.state) return null;
    return {
      state: v.state,
      next: v.next?.startsWith("/") && !v.next.startsWith("//") ? v.next : "/",
      locale: ["az", "ru", "en"].includes(v.locale ?? "") ? v.locale! : "az",
    };
  } catch {
    return null;
  }
}

function fail(origin: string, locale: string, reason: string) {
  const res = NextResponse.redirect(
    new URL(`/${locale}/login?google=${reason}`, origin)
  );
  res.cookies.set({ name: STATE_COOKIE, value: "", path: "/", expires: new Date(0) });
  return res;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const saved = readState(req);
  const locale = saved?.locale ?? "az";
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const code = url.searchParams.get("code");
  if (!clientId || !clientSecret || !code || !saved || url.searchParams.get("state") !== saved.state)
    return fail(url.origin, locale, "failed");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${url.origin}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    console.error("google token:", tokenRes.status, await tokenRes.text());
    return fail(url.origin, locale, "failed");
  }
  const tokens = (await tokenRes.json()) as { id_token?: string };
  if (!tokens.id_token) return fail(url.origin, locale, "failed");
  // Obtained directly from Google's token endpoint over TLS — per OIDC,
  // decoding without local signature verification is acceptable here.
  let claims: { sub?: string; email?: string; email_verified?: boolean; name?: string };
  try {
    const payload = tokens.id_token.split(".")[1];
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return fail(url.origin, locale, "failed");
  }
  if (!claims.sub) return fail(url.origin, locale, "failed");

  const existing = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: { provider: "google", providerAccountId: claims.sub },
    },
    select: { userId: true },
  });
  const viewer = await getCurrentUser();
  let userId: string;

  if (existing) {
    if (viewer && viewer.id !== existing.userId)
      return fail(url.origin, locale, "inuse"); // linked to someone else
    userId = existing.userId;
  } else if (viewer) {
    // Logged-in linking: attach to the session's user — explicit intent.
    await prisma.account.create({
      data: { userId: viewer.id, provider: "google", providerAccountId: claims.sub },
    });
    userId = viewer.id;
  } else if (claims.email && claims.email_verified) {
    const byEmail = await prisma.user.findUnique({ where: { email: claims.email } });
    if (byEmail) {
      await prisma.account.create({
        data: { userId: byEmail.id, provider: "google", providerAccountId: claims.sub },
      });
      if (!byEmail.emailVerifiedAt)
        await prisma.user.update({
          where: { id: byEmail.id },
          data: { emailVerifiedAt: new Date() },
        });
      userId = byEmail.id;
    } else {
      const created = await prisma.user.create({
        data: {
          email: claims.email,
          fullName: claims.name ?? null,
          emailVerifiedAt: new Date(),
          locale,
          accounts: {
            create: { provider: "google", providerAccountId: claims.sub },
          },
        },
      });
      userId = created.id;
    }
  } else {
    return fail(url.origin, locale, "failed");
  }

  const { token, expiresAt } = await createSession(userId);
  const res = NextResponse.redirect(new URL(saved.next, url.origin));
  res.cookies.set(sessionCookie(token, expiresAt));
  res.cookies.set({ name: STATE_COOKIE, value: "", path: "/", expires: new Date(0) });
  return res;
}

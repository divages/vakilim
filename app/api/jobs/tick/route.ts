import { NextResponse } from "next/server";
import { runTick } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

async function handle(req: Request) {
  const secret = process.env.JOBS_SECRET;
  if (!secret)
    return NextResponse.json({ ok: false, error: "SERVER_CONFIG" }, { status: 500 });

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`)
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 401 });

  const now = new Date();
  const counts = await runTick(now);
  const dayAgo = new Date(now.getTime() - 24 * 3600_000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600_000);
  const [otps, tokens, sessions] = await prisma.$transaction([
    prisma.otpCode.deleteMany({ where: { createdAt: { lt: dayAgo } } }),
    prisma.emailToken.deleteMany({ where: { createdAt: { lt: weekAgo } } }),
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
  const purged = {
    otpCodes: otps.count,
    emailTokens: tokens.count,
    sessions: sessions.count,
  };
  return NextResponse.json({ ok: true, ranAt: now.toISOString(), counts, purged });
}

export async function POST(req: Request) {
  return handle(req);
}

// cron services default to GET — same handler, same auth.
export async function GET(req: Request) {
  return handle(req);
}

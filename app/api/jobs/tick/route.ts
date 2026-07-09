import { NextResponse } from "next/server";
import { runTick } from "@/lib/jobs";

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
  return NextResponse.json({ ok: true, ranAt: now.toISOString(), counts });
}

export async function POST(req: Request) {
  return handle(req);
}

// cron services default to GET — same handler, same auth.
export async function GET(req: Request) {
  return handle(req);
}

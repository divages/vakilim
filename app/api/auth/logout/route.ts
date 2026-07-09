import { NextResponse } from "next/server";
import { destroyCurrentSession, clearedSessionCookie } from "@/lib/auth";

export async function POST() {
  await destroyCurrentSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(clearedSessionCookie());
  return res;
}
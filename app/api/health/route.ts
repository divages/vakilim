import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [users, practiceAreas] = await Promise.all([
    prisma.user.count(),
    prisma.practiceArea.count(),
  ]);
  return NextResponse.json({ ok: true, users, practiceAreas });
}
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const bodySchema = z.object({ locale: z.enum(["az", "ru", "en"]) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  if (user.locale !== parsed.data.locale)
    await prisma.user.update({
      where: { id: user.id },
      data: { locale: parsed.data.locale },
    });
  return NextResponse.json({ ok: true });
}

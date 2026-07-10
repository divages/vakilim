import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { consumeEmailToken } from "@/lib/email-tokens";
import { hashPassword } from "@/lib/password";

const bodySchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  if (!checkRateLimit(req, "reset", 10, 60 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const userId = await consumeEmailToken(parsed.data.token, "RESET");
  if (!userId)
    return NextResponse.json({ ok: false, error: "INVALID_TOKEN" }, { status: 400 });

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });
  await prisma.session.deleteMany({ where: { userId } }); // sign out everywhere
  return NextResponse.json({ ok: true });
}

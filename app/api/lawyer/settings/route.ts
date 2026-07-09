import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const bodySchema = z.object({
  bookingMode: z.enum(["INSTANT", "REQUEST"]),
  bufferMin: z.coerce.number().refine((v) => [0, 5, 10, 15].includes(v), {
    message: "invalid buffer",
  }),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile)
    return NextResponse.json({ ok: false, error: "NO_PROFILE" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  await prisma.lawyerProfile.update({
    where: { id: profile.id },
    data: {
      bookingMode: parsed.data.bookingMode,
      bufferMin: parsed.data.bufferMin,
    },
  });

  return NextResponse.json({ ok: true });
}

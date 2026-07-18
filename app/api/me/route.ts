import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

// SECURITY (audit §1.2): the previous version wrote a new `email` directly and
// left `emailVerifiedAt` untouched, so a verified account could change its
// address to a victim's while still counting as "verified". Combined with the
// Google callback (which adopted an existing row on email match), that enabled
// account pre-hijacking.
//
// Changing the account email SAFELY requires proving control of the NEW address
// (a pending-email + emailed-token flow). Until that flow exists, this endpoint
// updates the display name only and rejects any attempt to change or add an
// email, rather than silently ignoring it.
const bodySchema = z.object({
  fullName: z.string().trim().min(3).max(100),
  email: z.union([z.string().trim().email().max(120), z.literal("")]).optional(),
});

export async function PATCH(req: Request) {
  if (!checkRateLimit(req, "me", 15, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  // Reject email changes explicitly. Submitting the current email unchanged is
  // fine (the settings form may always send it); only a real change is refused.
  const requestedEmail = parsed.data.email ? parsed.data.email : null;
  if (requestedEmail !== null && requestedEmail !== user.email) {
    return NextResponse.json(
      { ok: false, error: "EMAIL_CHANGE_UNSUPPORTED" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { fullName: parsed.data.fullName },
  });

  return NextResponse.json({ ok: true });
}

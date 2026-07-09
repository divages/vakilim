import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const bodySchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().trim().min(5).max(500).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN")
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const { action, reason } = parsed.data;
  if (action === "REJECT" && !reason)
    return NextResponse.json({ ok: false, error: "REASON_REQUIRED" }, { status: 400 });

  const profile = await prisma.lawyerProfile.findUnique({ where: { id } });
  if (!profile)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const updated = await prisma.lawyerProfile.update({
    where: { id },
    data:
      action === "APPROVE"
        ? {
            verificationStatus: "APPROVED",
            rejectionReason: null,
            reviewedAt: new Date(),
          }
        : {
            verificationStatus: "REJECTED",
            rejectionReason: reason,
            reviewedAt: new Date(),
          },
  });

  return NextResponse.json({ ok: true, status: updated.verificationStatus });
}

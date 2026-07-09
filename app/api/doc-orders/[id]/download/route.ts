import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateAndStore } from "@/lib/docgen";
import { presignRecordingUrl } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const order = await prisma.docOrder.findUnique({ where: { id } });
  if (!order || order.userId !== user.id)
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (order.status !== "PAID")
    return NextResponse.json({ ok: false, error: "NOT_PAID" }, { status: 409 });

  let key = order.pdfKey;
  if (!key) {
    try {
      key = await generateAndStore(order.id);
    } catch (e) {
      console.error("Lazy doc generation failed:", e);
      return NextResponse.json(
        { ok: false, error: "GENERATION_FAILED" },
        { status: 502 }
      );
    }
  }

  const url = await presignRecordingUrl(key, 300);
  if (!url)
    return NextResponse.json({ ok: false, error: "SERVER_CONFIG" }, { status: 500 });

  return NextResponse.redirect(url);
}

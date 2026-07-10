import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { buildIcs } from "@/lib/ics";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, fullName: true } },
      lawyer: { include: { user: { select: { id: true, fullName: true } } } },
    },
  });
  if (!booking) return new NextResponse(null, { status: 404 });
  const isClient = booking.clientId === user.id;
  const isLawyer = booking.lawyer.user.id === user.id;
  if (!isClient && !isLawyer) return new NextResponse(null, { status: 403 });
  if (booking.status !== "CONFIRMED")
    return new NextResponse(null, { status: 409 });

  const t = await getTranslations({ locale: user.locale, namespace: "cal" });
  const other = isClient
    ? booking.lawyer.user.fullName ?? "Vakilim.az"
    : booking.client.fullName ?? "Vakilim.az";
  const url = `https://vakilim.az/call/${booking.id}`;
  const ics = buildIcs({
    uid: `${booking.id}@vakilim.az`,
    start: booking.startAt,
    end: booking.endAt,
    summary: t("summary", { name: other }),
    description: t("desc"),
    url,
  });
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="vakilim-${booking.id}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}

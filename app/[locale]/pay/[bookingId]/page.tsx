import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAzn } from "@/lib/money";
import { getTranslations } from "next-intl/server";
import { bakuDateIso, fmtMin } from "@/lib/slots";
import MockPayButton from "./mock-pay-button";

function bakuTimeLabel(d: Date): string {
  const dayStart = new Date(`${bakuDateIso(d)}T00:00:00+04:00`).getTime();
  return fmtMin(Math.round((d.getTime() - dayStart) / 60_000));
}

export default async function PayPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const t = await getTranslations();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/pay/${bookingId}`);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { lawyer: { include: { user: { select: { fullName: true } } } } },
  });
  if (!booking || booking.clientId !== user.id) redirect("/bookings");
  if (booking.status !== "PENDING_PAYMENT") redirect("/bookings");

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold text-navy">{t("common.payTitle")}</h1>

      <div className="mt-6 rounded-2xl border border-gray-100 shadow-sm p-4 text-sm">
        <p className="font-medium text-navy">
          {booking.lawyer.user.fullName ?? t("common.lawyer")}
        </p>
        <p className="mt-1">
          {t(`common.serviceType.${booking.serviceType}`)} · {booking.durationMin} {t("common.min")}
        </p>
        <p className="mt-1">
          {bakuDateIso(booking.startAt)} · {bakuTimeLabel(booking.startAt)}
        </p>
        <p className="mt-3 text-lg font-semibold text-navy">
          {formatAzn(booking.priceQepik)}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        {t("common.testPayNotice")}
      </div>

      <MockPayButton bookingId={booking.id} />
    </div>
  );
}

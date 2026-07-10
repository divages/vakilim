import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canReschedule } from "@/lib/reschedule";
import { bakuDateIso, fmtMin } from "@/lib/slots";
import ReschedulePicker from "./reschedule-picker";
import { getTranslations } from "next-intl/server";

function bakuTimeLabel(d: Date): string {
  const dayStart = new Date(`${bakuDateIso(d)}T00:00:00+04:00`).getTime();
  return fmtMin(Math.round((d.getTime() - dayStart) / 60_000));
}

export default async function ReschedulePage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const t = await getTranslations();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/reschedule/${bookingId}`);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      lawyer: { select: { slug: true, user: { select: { fullName: true } } } },
    },
  });
  if (!booking || booking.clientId !== user.id) redirect("/bookings");
  if (
    !booking.lawyer.slug ||
    !canReschedule(booking.status, booking.startAt, booking.rescheduledCount)
  )
    redirect("/bookings");

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-xl font-bold text-navy">{t("reschedule.title")}</h1>
      <p className="mt-2 text-sm">
        {booking.lawyer.user.fullName ?? t("common.lawyer")} · {t("reschedule.current")}{" "}
        <b className="text-navy">
          {bakuDateIso(booking.startAt)} · {bakuTimeLabel(booking.startAt)}
        </b>
      </p>
      <p className="mt-1 text-xs text-slate">
        {t("reschedule.rule")}
      </p>
      <ReschedulePicker
        bookingId={booking.id}
        lawyerSlug={booking.lawyer.slug}
        serviceId={booking.serviceId}
      />
    </div>
  );
}

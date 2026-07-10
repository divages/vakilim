import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAzn } from "@/lib/money";
import { bakuDateIso, fmtMin, weekdayOfIso } from "@/lib/slots";
import DecisionButtons from "./decision-buttons";
import { completePastBookings } from "@/lib/bookings";
import { isJoinable } from "@/lib/call-window";
import { getTranslations } from "next-intl/server";

const STATUS_CLS: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-emerald/15 text-navy",
  DECLINED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  COMPLETED: "bg-navy/10 text-navy",
  PENDING_PAYMENT: "bg-gray-100 text-gray-700",
};

function bakuTimeLabel(d: Date): string {
  const dayStart = new Date(`${bakuDateIso(d)}T00:00:00+04:00`).getTime();
  return fmtMin(Math.round((d.getTime() - dayStart) / 60_000));
}


export default async function LawyerBookingsPage() {
  const t = await getTranslations();
function when(d: Date): string {
  const iso = bakuDateIso(d);
  return `${t(`common.wd.${weekdayOfIso(iso)}`)} · ${iso} · ${bakuTimeLabel(d)}`;
}

  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/lawyer/bookings");

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) redirect("/lawyer/apply");

  await completePastBookings({ lawyerId: profile.id });

  const now = new Date();
  const bookings = await prisma.booking.findMany({
    where: { lawyerId: profile.id },
    orderBy: { startAt: "asc" },
    include: { client: { select: { fullName: true, phone: true } } },
  });


  const unreadRows = await prisma.message.groupBy({
    by: ["bookingId"],
    where: {
      bookingId: { in: bookings.map((b) => b.id) },
      readAt: null,
      NOT: { senderId: user.id },
    },
    _count: { _all: true },
  });
  const unreadByBooking = new Map(
    unreadRows.map((r) => [r.bookingId, r._count._all])
  );

  const requested = bookings.filter((b) => b.status === "REQUESTED");
  const upcoming = bookings.filter(
    (b) => b.status === "CONFIRMED" && b.startAt > now
  );
  const rest = bookings
    .filter((b) => !requested.includes(b) && !upcoming.includes(b))
    .slice(-10)
    .reverse();

  const Card = ({ b, actions }: { b: (typeof bookings)[number]; actions?: boolean }) => {
    const badge = { cls: STATUS_CLS[b.status] ?? STATUS_CLS.CONFIRMED, label: t(`lawB.status.${b.status}`) };
    return (
      <div className="rounded border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-navy">
              {b.client.fullName ?? t("common.client")}
              {b.status === "CONFIRMED" && b.client.phone && (
                <span className="ml-2 text-sm font-normal text-slate">
                  {b.client.phone}
                </span>
              )}
            </p>
            <p className="mt-1 text-sm">
              {t(`common.serviceType.${b.serviceType}`)} · {b.durationMin} {t("common.min")}
            </p>
            <p className="mt-1 text-sm">{when(b.startAt)}</p>
          </div>
          <div className="text-right">
            <span className={`rounded px-2 py-1 text-xs font-medium ${badge.cls}`}>
              {badge.label}
            </span>
            <p className="mt-2 text-sm font-semibold text-navy">
              {formatAzn(b.priceQepik)}
            </p>
          </div>
        </div>
        {b.status === "CONFIRMED" && isJoinable(b.startAt, b.endAt, now) && (
          <Link
            href={`/call/${b.id}`}
            className="mt-3 inline-block rounded bg-emerald px-4 py-2 text-sm font-medium text-navy-dark hover:opacity-90"
          >
            {t("bookings.join")}
          </Link>
        )}
        {["REQUESTED", "CONFIRMED", "COMPLETED"].includes(b.status) && (
          <Link
            href={`/chat/${b.id}`}
            className="mt-3 ml-2 inline-block rounded border border-gray-300 px-4 py-2 text-sm font-medium text-navy hover:border-navy"
          >
            {t("bookings.chat")}
            {(unreadByBooking.get(b.id) ?? 0) > 0 && (
              <span className="ml-2 rounded-full bg-emerald px-1.5 text-xs font-bold text-navy-dark">
                {unreadByBooking.get(b.id)}
              </span>
            )}
          </Link>
        )}
        {actions && <DecisionButtons bookingId={b.id} />}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">{t("dash.bookT")}</h1>

      <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-slate">
        {t("lawB.reqSection", { n: requested.length })}
      </h2>
      {requested.length === 0 ? (
        <p className="mt-3 rounded border border-gray-200 bg-gray-50 p-4 text-sm">
          {t("lawB.reqEmpty")}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {requested.map((b) => (
            <Card key={b.id} b={b} actions />
          ))}
        </div>
      )}

      <h2 className="mt-10 text-sm font-medium uppercase tracking-wide text-slate">
        {t("lawB.upSection", { n: upcoming.length })}
      </h2>
      {upcoming.length === 0 ? (
        <p className="mt-3 rounded border border-gray-200 bg-gray-50 p-4 text-sm">
          {t("lawB.upEmpty")}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {upcoming.map((b) => (
            <Card key={b.id} b={b} />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <>
          <h2 className="mt-10 text-sm font-medium uppercase tracking-wide text-slate">
            {t("lawB.other")}
          </h2>
          <div className="mt-3 space-y-3">
            {rest.map((b) => (
              <Card key={b.id} b={b} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

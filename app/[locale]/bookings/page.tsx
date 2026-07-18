import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAzn } from "@/lib/money";
import { cancellationRefund } from "@/lib/policy";
import { completePastBookings } from "@/lib/bookings";
import { isJoinable } from "@/lib/call-window";
import { canOpenDispute } from "@/lib/disputes";
import { canReschedule } from "@/lib/reschedule";
import { getTranslations } from "next-intl/server";
import { bakuDateIso, fmtMin, weekdayOfIso } from "@/lib/slots";
import CancelButton from "./cancel-button";
import { Link } from "@/i18n/navigation";

const STATUS_CLS: Record<string, string> = {
  PENDING_PAYMENT: "bg-gray-100 text-gray-700",
  REQUESTED: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-emerald/15 text-navy",
  DECLINED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  COMPLETED: "bg-navy/10 text-navy",
};

const CANCELLABLE = ["PENDING_PAYMENT", "REQUESTED", "CONFIRMED"];

function bakuTimeLabel(d: Date): string {
  const dayStart = new Date(`${bakuDateIso(d)}T00:00:00+04:00`).getTime();
  return fmtMin(Math.round((d.getTime() - dayStart) / 60_000));
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const skip = (page - 1) * 30;
  const t = await getTranslations();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/bookings");

  await completePastBookings({ clientId: user.id });

  const now = new Date();
  const bookings = await prisma.booking.findMany({
    where: { clientId: user.id },
    orderBy: { startAt: "asc" },
    include: {
      lawyer: { select: { slug: true, user: { select: { fullName: true } } } },
      payment: { select: { amountQepik: true, refundedQepik: true } },
      review: { select: { id: true } },
      dispute: { select: { status: true } },
    },
    skip,
    take: 30 + 1,
  });
  const hasMore = bookings.length > 30;
  if (hasMore) bookings.pop();


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

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">{t("bookings.title")}</h1>

      {bookings.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-6 text-sm">
          {t("bookings.empty")}{" "}
          <Link href="/lawyers" className="text-emerald underline">
            {t("bookings.pick")}
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {bookings.map((b) => {
            const badge = { cls: STATUS_CLS[b.status] ?? STATUS_CLS.CONFIRMED, label: t(`common.status.${b.status}`) };
            const dateIso = bakuDateIso(b.startAt);
            const cancellable =
              CANCELLABLE.includes(b.status) && b.startAt > now;
            const preview = b.payment
              ? cancellationRefund(b.payment.amountQepik, b.startAt, now)
              : { pct: 0 as const, refundQepik: 0 };

            return (
              <div key={b.id} className="rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/lawyers/${b.lawyer.slug}`}
                      className="font-medium text-navy hover:underline"
                    >
                      {b.lawyer.user.fullName ?? t("common.lawyer")}
                    </Link>
                    <p className="mt-1 text-sm">
                      {t(`common.serviceType.${b.serviceType}`)} · {b.durationMin} {t("common.min")}
                    </p>
                    <p className="mt-1 text-sm">
                      {t(`common.wd.${weekdayOfIso(dateIso)}`)} · {dateIso} ·{" "}
                      {bakuTimeLabel(b.startAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                    <p className="mt-2 text-sm font-semibold text-navy">
                      {formatAzn(b.priceQepik)}
                    </p>
                    {b.payment && b.payment.refundedQepik > 0 && (
                      <p className="mt-1 text-xs text-emerald">
                        {t("bookings.refunded")} {formatAzn(b.payment.refundedQepik)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {["REQUESTED", "CONFIRMED", "COMPLETED"].includes(
                    b.status
                  ) && (
                    <Link
                      href={`/chat/${b.id}`}
                      className="rounded-xl border border-gray-100 px-4 py-2 text-sm font-medium text-navy hover:border-navy"
                    >
                      {t("bookings.chat")}
                      {(unreadByBooking.get(b.id) ?? 0) > 0 && (
                        <span className="ml-2 rounded-full bg-emerald px-1.5 text-xs font-bold text-navy-dark">
                          {unreadByBooking.get(b.id)}
                        </span>
                      )}
                    </Link>
                  )}
                  {b.status === "CONFIRMED" &&
                    isJoinable(b.startAt, b.endAt, now) && (
                      <Link
                        href={`/call/${b.id}`}
                        className="rounded-xl bg-emerald px-4 py-2 text-sm font-medium text-navy-dark hover:opacity-90"
                      >
                        {t("bookings.join")}
                      </Link>
                    )}
                  {b.status === "CONFIRMED" && (
                    <a
                      href={`/api/bookings/${b.id}/calendar`}
                      className="rounded-xl border border-gray-100 px-4 py-2 text-sm font-medium text-navy hover:border-navy"
                    >
                      {t("bookings.addCal")}
                    </a>
                  )}
                  {b.status === "PENDING_PAYMENT" && (
                    <Link
                      href={`/pay/${b.id}`}
                      className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
                    >
                      {t("documents.completePay")}
                    </Link>
                  )}
                  {b.status === "COMPLETED" && b.payment && !b.review && (
                    <Link
                      href={`/review/${b.id}`}
                      className="rounded-xl border border-gray-100 px-4 py-2 text-sm font-medium text-navy hover:border-navy"
                    >
                      {t("bookings.review")}
                    </Link>
                  )}
                  {!b.dispute &&
                    canOpenDispute(b.status, b.endAt, now) && (
                      <Link
                        href={`/dispute/${b.id}`}
                        className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Problem bildir
                      </Link>
                    )}
                  {b.dispute && (
                    <span className="rounded-xl bg-navy/10 px-3 py-2 text-xs font-medium text-navy">
                      {b.dispute.status === "RESOLVED"
                        ? t("bookings.disputeResolved")
                        : t("bookings.disputeOpen")}
                    </span>
                  )}
                  {canReschedule(
                    b.status,
                    b.startAt,
                    b.rescheduledCount,
                    now
                  ) && (
                    <Link
                      href={`/reschedule/${b.id}`}
                      className="rounded-xl border border-gray-100 px-4 py-2 text-sm font-medium text-navy hover:border-navy"
                    >
                      {t("bookings.reschedule")}
                    </Link>
                  )}
                  {cancellable && (
                    <CancelButton
                      bookingId={b.id}
                      refundLabel={
                        b.payment
                          ? `${formatAzn(preview.refundQepik)} (${preview.pct}%)`
                          : t("bookings.unpaid")
                      }
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {hasMore && (
        <div className="mt-6 text-center">
          <Link
            href={`?page=${page + 1}`}
            className="inline-block rounded-xl border border-gray-100 px-4 py-2 text-sm text-navy hover:border-navy"
          >
            {t("common.more")}
          </Link>
        </div>
      )}
    </div>
  );
}

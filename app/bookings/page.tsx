import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAzn } from "@/lib/money";
import { cancellationRefund } from "@/lib/policy";
import { completePastBookings } from "@/lib/bookings";
import { isJoinable } from "@/lib/call-window";
import { bakuDateIso, fmtMin, WEEKDAY_LABELS_AZ, weekdayOfIso } from "@/lib/slots";
import CancelButton from "./cancel-button";

const SERVICE_LABELS: Record<string, string> = {
  VIDEO: "Video görüş",
  AUDIO: "Səsli zəng",
  WRITTEN: "Yazılı cavab",
  DOC_REVIEW: "Sənəd yoxlanışı",
};

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "Ödəniş gözlənilir", cls: "bg-gray-100 text-gray-700" },
  REQUESTED: { label: "Vəkilin təsdiqi gözlənilir", cls: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Təsdiqlənib", cls: "bg-emerald/15 text-navy" },
  DECLINED: { label: "Vəkil imtina etdi", cls: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Ləğv edilib", cls: "bg-gray-100 text-gray-500" },
  COMPLETED: { label: "Baş tutub", cls: "bg-navy/10 text-navy" },
};

const CANCELLABLE = ["PENDING_PAYMENT", "REQUESTED", "CONFIRMED"];

function bakuTimeLabel(d: Date): string {
  const dayStart = new Date(`${bakuDateIso(d)}T00:00:00+04:00`).getTime();
  return fmtMin(Math.round((d.getTime() - dayStart) / 60_000));
}

export default async function BookingsPage() {
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
    },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">Görüşlərim</h1>

      {bookings.length === 0 ? (
        <p className="mt-6 rounded border border-gray-200 bg-gray-50 p-6 text-sm">
          Hələ görüşünüz yoxdur.{" "}
          <Link href="/lawyers" className="text-emerald underline">
            Vəkil seçin
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {bookings.map((b) => {
            const badge = STATUS_BADGES[b.status] ?? STATUS_BADGES.CONFIRMED;
            const dateIso = bakuDateIso(b.startAt);
            const cancellable =
              CANCELLABLE.includes(b.status) && b.startAt > now;
            const preview = b.payment
              ? cancellationRefund(b.payment.amountQepik, b.startAt, now)
              : { pct: 0 as const, refundQepik: 0 };

            return (
              <div key={b.id} className="rounded border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/lawyers/${b.lawyer.slug}`}
                      className="font-medium text-navy hover:underline"
                    >
                      {b.lawyer.user.fullName ?? "Vəkil"}
                    </Link>
                    <p className="mt-1 text-sm">
                      {SERVICE_LABELS[b.serviceType]} · {b.durationMin} dəq
                    </p>
                    <p className="mt-1 text-sm">
                      {WEEKDAY_LABELS_AZ[weekdayOfIso(dateIso)]} · {dateIso} ·{" "}
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
                        Geri qaytarıldı: {formatAzn(b.payment.refundedQepik)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {b.status === "CONFIRMED" &&
                    isJoinable(b.startAt, b.endAt, now) && (
                      <Link
                        href={`/call/${b.id}`}
                        className="rounded bg-emerald px-4 py-2 text-sm font-medium text-navy-dark hover:opacity-90"
                      >
                        Görüşə qoşul
                      </Link>
                    )}
                  {b.status === "PENDING_PAYMENT" && (
                    <Link
                      href={`/pay/${b.id}`}
                      className="rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
                    >
                      Ödənişi tamamla
                    </Link>
                  )}
                  {cancellable && (
                    <CancelButton
                      bookingId={b.id}
                      refundLabel={
                        b.payment
                          ? `${formatAzn(preview.refundQepik)} (${preview.pct}%)`
                          : "ödəniş edilməyib"
                      }
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

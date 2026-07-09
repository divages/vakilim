import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAzn } from "@/lib/money";
import { bakuDateIso, fmtMin, WEEKDAY_LABELS_AZ, weekdayOfIso } from "@/lib/slots";
import DecisionButtons from "./decision-buttons";
import { completePastBookings } from "@/lib/bookings";
import { isJoinable } from "@/lib/call-window";

const SERVICE_LABELS: Record<string, string> = {
  VIDEO: "Video görüş",
  AUDIO: "Səsli zəng",
  WRITTEN: "Yazılı cavab",
  DOC_REVIEW: "Sənəd yoxlanışı",
};

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  REQUESTED: { label: "Təsdiq gözləyir", cls: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Təsdiqlənib", cls: "bg-emerald/15 text-navy" },
  DECLINED: { label: "İmtina edilib", cls: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Müştəri ləğv edib", cls: "bg-gray-100 text-gray-500" },
  COMPLETED: { label: "Baş tutub", cls: "bg-navy/10 text-navy" },
  PENDING_PAYMENT: { label: "Ödəniş gözlənilir", cls: "bg-gray-100 text-gray-700" },
};

function bakuTimeLabel(d: Date): string {
  const dayStart = new Date(`${bakuDateIso(d)}T00:00:00+04:00`).getTime();
  return fmtMin(Math.round((d.getTime() - dayStart) / 60_000));
}

function when(d: Date): string {
  const iso = bakuDateIso(d);
  return `${WEEKDAY_LABELS_AZ[weekdayOfIso(iso)]} · ${iso} · ${bakuTimeLabel(d)}`;
}

export default async function LawyerBookingsPage() {
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

  const requested = bookings.filter((b) => b.status === "REQUESTED");
  const upcoming = bookings.filter(
    (b) => b.status === "CONFIRMED" && b.startAt > now
  );
  const rest = bookings
    .filter((b) => !requested.includes(b) && !upcoming.includes(b))
    .slice(-10)
    .reverse();

  const Card = ({ b, actions }: { b: (typeof bookings)[number]; actions?: boolean }) => {
    const badge = STATUS_BADGES[b.status] ?? STATUS_BADGES.CONFIRMED;
    return (
      <div className="rounded border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-navy">
              {b.client.fullName ?? "Müştəri"}
              {b.status === "CONFIRMED" && b.client.phone && (
                <span className="ml-2 text-sm font-normal text-slate">
                  {b.client.phone}
                </span>
              )}
            </p>
            <p className="mt-1 text-sm">
              {SERVICE_LABELS[b.serviceType]} · {b.durationMin} dəq
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
            Görüşə qoşul
          </Link>
        )}
        {actions && <DecisionButtons bookingId={b.id} />}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">Görüşlər</h1>

      <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-slate">
        Təsdiq gözləyən ({requested.length})
      </h2>
      {requested.length === 0 ? (
        <p className="mt-3 rounded border border-gray-200 bg-gray-50 p-4 text-sm">
          Təsdiq gözləyən sifariş yoxdur.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {requested.map((b) => (
            <Card key={b.id} b={b} actions />
          ))}
        </div>
      )}

      <h2 className="mt-10 text-sm font-medium uppercase tracking-wide text-slate">
        Yaxınlaşan görüşlər ({upcoming.length})
      </h2>
      {upcoming.length === 0 ? (
        <p className="mt-3 rounded border border-gray-200 bg-gray-50 p-4 text-sm">
          Yaxınlaşan görüş yoxdur.
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
            Digər
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

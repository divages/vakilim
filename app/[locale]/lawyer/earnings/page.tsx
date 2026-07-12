import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatAzn } from "@/lib/money";
import { bakuDateIso } from "@/lib/slots";

const MONTHS = 6;

export default async function LawyerEarningsPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/lawyer/earnings");
  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, verificationStatus: true },
  });
  if (!profile) redirect("/lawyer/apply");

  const bakuNow = new Date(Date.now() + 4 * 3600_000);
  const y0 = bakuNow.getUTCFullYear();
  const m0 = bakuNow.getUTCMonth();
  const bounds = Array.from({ length: MONTHS }, (_, k) => {
    const start = new Date(Date.UTC(y0, m0 - k, 1) - 4 * 3600_000);
    const end = new Date(Date.UTC(y0, m0 - k + 1, 1) - 4 * 3600_000);
    const d = new Date(Date.UTC(y0, m0 - k, 1));
    const label = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return { start, end, label };
  });
  const windowStart = bounds[MONTHS - 1].start;

  const bookings = await prisma.booking.findMany({
    where: {
      lawyerId: profile.id,
      status: "COMPLETED",
      startAt: { gte: windowStart },
    },
    orderBy: { startAt: "desc" },
    select: {
      id: true,
      startAt: true,
      priceQepik: true,
      client: { select: { fullName: true } },
    },
  });
  const disputes =
    bookings.length > 0
      ? await prisma.dispute.findMany({
          where: {
            bookingId: { in: bookings.map((b) => b.id) },
            refundQepik: { gt: 0 },
          },
          select: { bookingId: true, refundQepik: true },
        })
      : [];
  const refundBy = new Map<string, number>();
  for (const d of disputes)
    refundBy.set(d.bookingId, (refundBy.get(d.bookingId) ?? 0) + (d.refundQepik ?? 0));

  const rows = bounds.map(({ start, end, label }) => {
    const inMonth = bookings.filter((b) => b.startAt >= start && b.startAt < end);
    const gross = inMonth.reduce((a, b) => a + b.priceQepik, 0);
    const refunds = inMonth.reduce((a, b) => a + (refundBy.get(b.id) ?? 0), 0);
    return { label, count: inMonth.length, gross, refunds, net: gross - refunds };
  });
  const thisMonth = bookings.filter(
    (b) => b.startAt >= bounds[0].start && b.startAt < bounds[0].end
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <Link href="/lawyer/dashboard" className="text-sm font-medium text-emerald hover:underline">
        ← {t("earn.back")}
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">
        {t("earn.title")}
      </h1>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-slate">
            <tr>
              <th className="px-4 py-3">{t("earn.colMonth")}</th>
              <th className="px-4 py-3">{t("earn.colMeet")}</th>
              <th className="px-4 py-3">{t("earn.colGross")}</th>
              <th className="px-4 py-3">{t("earn.colRef")}</th>
              <th className="px-4 py-3">{t("earn.colNet")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="px-4 py-3 font-medium text-navy">{r.label}</td>
                <td className="px-4 py-3">{r.count}</td>
                <td className="px-4 py-3">{formatAzn(r.gross)}</td>
                <td className="px-4 py-3 text-red-600">
                  {r.refunds > 0 ? `−${formatAzn(r.refunds)}` : "—"}
                </td>
                <td className="px-4 py-3 font-bold text-navy">{formatAzn(r.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-sm font-medium uppercase tracking-wide text-slate">
        {t("earn.detail")}
      </h2>
      {thisMonth.length === 0 ? (
        <p className="mt-3 text-sm text-slate">{t("earn.empty")}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {thisMonth.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm shadow-sm"
            >
              <span className="text-slate">
                {bakuDateIso(b.startAt)} ·{" "}
                {(b.client.fullName ?? "—").split(" ")[0]}
              </span>
              <span className="font-bold text-navy">{formatAzn(b.priceQepik)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

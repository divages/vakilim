import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { formatAzn } from "@/lib/money";

export default async function LawyerDashboardPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/lawyer/dashboard");

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
    include: { practiceAreas: { include: { practiceArea: true } } },
  });
  if (!profile) redirect("/lawyer/apply");

  const status = profile.verificationStatus;

  const bakuNow = new Date(Date.now() + 4 * 3600_000);
  const monthStart = new Date(
    Date.UTC(bakuNow.getUTCFullYear(), bakuNow.getUTCMonth(), 1) -
      4 * 3600_000
  );
  const completed =
    status === "APPROVED"
      ? await prisma.booking.findMany({
          where: {
            lawyerId: profile.id,
            status: "COMPLETED",
            startAt: { gte: monthStart },
          },
          select: { id: true, priceQepik: true },
        })
      : [];
  const refunds =
    completed.length > 0
      ? await prisma.dispute.findMany({
          where: {
            bookingId: { in: completed.map((b) => b.id) },
            refundQepik: { gt: 0 },
          },
          select: { refundQepik: true },
        })
      : [];
  const ratingAgg =
    status === "APPROVED"
      ? await prisma.review.aggregate({
          where: { lawyerId: profile.id, hidden: false },
          _avg: { stars: true },
          _count: true,
        })
      : null;
  const gross = completed.reduce((a, b) => a + b.priceQepik, 0);
  const net = gross - refunds.reduce((a, r) => a + (r.refundQepik ?? 0), 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">{t("dash.title")}</h1>

      {status === "PENDING" && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-bold text-amber-800">{t("dash.pendingT")}</p>
          <p className="mt-1 text-sm text-amber-800/80">{t("dash.pendingBody")}</p>
        </div>
      )}

      {status === "APPROVED" && (
        <div className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white shadow-lg shadow-emerald-200">
          <p className="font-bold">{t("dash.okT")}</p>
          <p className="mt-1 text-sm text-emerald-50">{t("dash.okBody")}</p>
        </div>
      )}

      {status === "REJECTED" && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-bold text-red-700">{t("dash.rejT")}</p>
          <p className="mt-1 text-sm text-red-700/80">
            {profile.rejectionReason ?? t("dash.rejBody")}
          </p>
        </div>
      )}

      {status === "APPROVED" && (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate">{t("dash.statMeet")}</p>
              <p className="mt-1 text-2xl font-extrabold text-navy">{completed.length}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate">{t("dash.statEarn")}</p>
              <p className="mt-1 text-2xl font-extrabold text-navy">{formatAzn(net)}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate">{t("dash.statRating")}</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald">
                {ratingAgg && ratingAgg._count > 0 ? `★ ${(ratingAgg._avg.stars ?? 0).toFixed(1)}` : "—"}
              </p>
            </div>
          </div>
          <p className="mt-2 text-right">
            <Link href="/lawyer/earnings" className="text-sm font-medium text-emerald hover:underline">
              {t("dash.earnLink")}
            </Link>
          </p>
        </>
      )}

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-gray-100 shadow-sm p-4">
        <div>
          <p className="text-sm font-medium text-navy">{t("dash.svcT")}</p>
          <p className="mt-1 text-sm">
            {t("dash.svcD")}
          </p>
        </div>
        <Link
          href="/lawyer/services"
          className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
        >
          {t("common.manage")}
        </Link>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl border border-gray-100 shadow-sm p-4">
        <div>
          <p className="text-sm font-medium text-navy">{t("dash.availT")}</p>
          <p className="mt-1 text-sm">
            {t("dash.availD")}
          </p>
        </div>
        <Link
          href="/lawyer/availability"
          className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
        >
          {t("common.manage")}
        </Link>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl border border-gray-100 shadow-sm p-4">
        <div>
          <p className="text-sm font-medium text-navy">{t("dash.bookT")}</p>
          <p className="mt-1 text-sm">
            {t("dash.bookD")}
          </p>
        </div>
        <Link
          href="/lawyer/bookings"
          className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
        >
          {t("common.view")}
        </Link>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl border border-gray-100 shadow-sm p-4">
        <div>
          <p className="text-sm font-medium text-navy">{t("dash.dispT")}</p>
          <p className="mt-1 text-sm">
            {t("dash.dispD")}
          </p>
        </div>
        <Link
          href="/lawyer/disputes"
          className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
        >
          {t("common.view")}
        </Link>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl border border-gray-100 shadow-sm p-4">
        <div>
          <p className="text-sm font-medium text-navy">{t("dash.revT")}</p>
          <p className="mt-1 text-sm">
            {t("dash.revD")}
          </p>
        </div>
        <Link
          href="/lawyer/reviews"
          className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
        >
          {t("common.view")}
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-navy">
          {t("dash.sent")}
        </div>
        <dl className="divide-y divide-gray-100 text-sm">
          <Row label={t("apply.fullName")} value={user.fullName ?? "—"} />
          <Row label={t("dash.rowStatus")} value={t(`common.lawyerTypeFull.${profile.type}`)} />
          <Row label={t("apply.licenseNo")} value={profile.licenseNo ?? "—"} />
          <Row label={t("apply.city")} value={profile.city} />
          <Row
            label={t("dash.rowYears")}
            value={
              profile.yearsExperience !== null
                ? `${profile.yearsExperience} il`
                : "—"
            }
          />
          <Row
            label={t("apply.langs")}
            value={profile.languages.map((l) => t(`common.langName.${l}`)).join(", ")}
          />
          <Row
            label={t("dash.rowAreas")}
            value={profile.practiceAreas
              .map((pa) => pa.practiceArea.nameAz)
              .join(", ")}
          />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-slate">{label}</dt>
      <dd className="text-right font-medium text-navy">{value}</dd>
    </div>
  );
}

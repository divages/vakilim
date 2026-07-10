import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">{t("dash.title")}</h1>

      {status === "PENDING" && (
        <div className="mt-6 rounded border border-amber-200 bg-amber-50 p-4">
          <p className="font-medium text-amber-800">{t("dash.pendingT")}</p>
          <p className="mt-1 text-sm text-amber-800">
            {t("dash.pendingBody")}
          </p>
        </div>
      )}

      {status === "APPROVED" && (
        <div className="mt-6 rounded border border-emerald/30 bg-emerald/10 p-4">
          <p className="font-medium text-navy">{t("dash.okT")}</p>
          <p className="mt-1 text-sm">
            {t("dash.okBody")}
          </p>
        </div>
      )}

      {status === "REJECTED" && (
        <div className="mt-6 rounded border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-700">{t("dash.rejT")}</p>
          <p className="mt-1 text-sm text-red-700">
            {profile.rejectionReason ??
              t("dash.rejBody")}
          </p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between rounded border border-gray-200 p-4">
        <div>
          <p className="text-sm font-medium text-navy">{t("dash.svcT")}</p>
          <p className="mt-1 text-sm">
            {t("dash.svcD")}
          </p>
        </div>
        <Link
          href="/lawyer/services"
          className="rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
        >
          {t("common.manage")}
        </Link>
      </div>

      <div className="mt-3 flex items-center justify-between rounded border border-gray-200 p-4">
        <div>
          <p className="text-sm font-medium text-navy">{t("dash.availT")}</p>
          <p className="mt-1 text-sm">
            {t("dash.availD")}
          </p>
        </div>
        <Link
          href="/lawyer/availability"
          className="rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
        >
          {t("common.manage")}
        </Link>
      </div>

      <div className="mt-3 flex items-center justify-between rounded border border-gray-200 p-4">
        <div>
          <p className="text-sm font-medium text-navy">{t("dash.bookT")}</p>
          <p className="mt-1 text-sm">
            {t("dash.bookD")}
          </p>
        </div>
        <Link
          href="/lawyer/bookings"
          className="rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
        >
          {t("common.view")}
        </Link>
      </div>

      <div className="mt-3 flex items-center justify-between rounded border border-gray-200 p-4">
        <div>
          <p className="text-sm font-medium text-navy">{t("dash.dispT")}</p>
          <p className="mt-1 text-sm">
            {t("dash.dispD")}
          </p>
        </div>
        <Link
          href="/lawyer/disputes"
          className="rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
        >
          {t("common.view")}
        </Link>
      </div>

      <div className="mt-3 flex items-center justify-between rounded border border-gray-200 p-4">
        <div>
          <p className="text-sm font-medium text-navy">{t("dash.revT")}</p>
          <p className="mt-1 text-sm">
            {t("dash.revD")}
          </p>
        </div>
        <Link
          href="/lawyer/reviews"
          className="rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
        >
          {t("common.view")}
        </Link>
      </div>

      <div className="mt-8 rounded border border-gray-200">
        <div className="border-b border-gray-200 px-4 py-3 text-sm font-medium text-navy">
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

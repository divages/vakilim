import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReviewCard, { type Application } from "./review-card";
import { presignRecordingUrl } from "@/lib/storage";
import { getTranslations } from "next-intl/server";

async function loadApplications() {
  const include = {
    user: { select: { phone: true, fullName: true } },
    practiceAreas: { include: { practiceArea: true } },
  } as const;

  const [pending, decided] = await Promise.all([
    prisma.lawyerProfile.findMany({
      where: { verificationStatus: "PENDING" },
      include,
      orderBy: { createdAt: "asc" },
    }),
    prisma.lawyerProfile.findMany({
      where: { verificationStatus: { not: "PENDING" } },
      include,
      orderBy: { reviewedAt: "desc" },
      take: 10,
    }),
  ]);

  const toApp = async (p: (typeof pending)[number]): Promise<Application> => ({
    id: p.id,
    licenseDocUrl: p.licenseDocKey
      ? await presignRecordingUrl(p.licenseDocKey, 600)
      : null,
    licenseDocIsPdf: p.licenseDocKey?.endsWith(".pdf") ?? false,
    idDocUrl: p.idDocKey ? await presignRecordingUrl(p.idDocKey, 600) : null,
    idDocIsPdf: p.idDocKey?.endsWith(".pdf") ?? false,
    fullName: p.user.fullName ?? "—",
    phone: p.user.phone ?? "—",
    type: p.type,
    status: p.verificationStatus,
    rejectionReason: p.rejectionReason,
    licenseNo: p.licenseNo ?? "—",
    yearsExperience: p.yearsExperience ?? 0,
    city: p.city,
    bio: p.bioAz ?? "",
    languages: p.languages,
    areas: p.practiceAreas.map((pa) => pa.practiceArea.nameAz),
  });

  return {
    pending: await Promise.all(pending.map(toApp)),
    decided: await Promise.all(decided.map(toApp)),
  };
}

export default async function VerificationsPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const { pending, decided } = await loadApplications();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">{t("admV.title")}</h1>

      <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-slate">
        {t("admV.pending", { n: pending.length })}
      </h2>
      {pending.length === 0 ? (
        <p className="mt-3 rounded border border-gray-200 bg-gray-50 p-4 text-sm">
          {t("admV.pendingEmpty")}
        </p>
      ) : (
        <div className="mt-3 space-y-4">
          {pending.map((a) => (
            <ReviewCard key={a.id} app={a} />
          ))}
        </div>
      )}

      <h2 className="mt-10 text-sm font-medium uppercase tracking-wide text-slate">
        {t("admV.recent")}
      </h2>
      {decided.length === 0 ? (
        <p className="mt-3 rounded border border-gray-200 bg-gray-50 p-4 text-sm">
          {t("admV.recentEmpty")}
        </p>
      ) : (
        <div className="mt-3 space-y-4">
          {decided.map((a) => (
            <ReviewCard key={a.id} app={a} />
          ))}
        </div>
      )}
    </div>
  );
}

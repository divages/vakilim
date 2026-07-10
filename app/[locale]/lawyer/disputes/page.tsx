import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lawyerResponseDeadline } from "@/lib/disputes";
import { bakuDateIso, fmtMin } from "@/lib/slots";
import ResponseForm from "./response-form";
import { getTranslations } from "next-intl/server";

const DSTATUS_CLS: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  RESPONDED: "bg-navy/10 text-navy",
  RESOLVED: "bg-gray-100 text-gray-600",
};

function bakuTimeLabel(d: Date): string {
  const dayStart = new Date(`${bakuDateIso(d)}T00:00:00+04:00`).getTime();
  return fmtMin(Math.round((d.getTime() - dayStart) / 60_000));
}

export default async function LawyerDisputesPage() {
  const t = await getTranslations();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/lawyer/disputes");

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) redirect("/lawyer/apply");

  const disputes = await prisma.dispute.findMany({
    where: { booking: { lawyerId: profile.id } },
    orderBy: { createdAt: "desc" },
    include: {
      booking: {
        include: { client: { select: { fullName: true } } },
      },
    },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">{t("dash.dispT")}</h1>

      {disputes.length === 0 ? (
        <p className="mt-6 rounded border border-gray-200 bg-gray-50 p-6 text-sm">
          {t("lawD.empty")}
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {disputes.map((d) => {
            const badge = { cls: DSTATUS_CLS[d.status], label: t(`lawD.status.${d.status}`) };
            return (
              <div key={d.id} className="rounded border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-navy">
                      {d.booking.client.fullName ?? t("common.client")} ·{" "}
                      {t(`dispute.reasons.${d.reason}`)}
                    </p>
                    <p className="mt-1 text-xs text-slate">
                      {t("lawD.meeting")} {bakuDateIso(d.booking.startAt)} ·{" "}
                      {bakuTimeLabel(d.booking.startAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <p className="mt-3 rounded bg-gray-50 p-3 text-sm">
                  {d.description}
                </p>

                {d.status === "OPEN" && (
                  <>
                    <p className="mt-2 text-xs text-red-700">
                      {t("lawD.deadline")}{" "}
                      {bakuDateIso(lawyerResponseDeadline(d.createdAt))} ·{" "}
                      {bakuTimeLabel(lawyerResponseDeadline(d.createdAt))}
                    </p>
                    <ResponseForm disputeId={d.id} />
                  </>
                )}

                {d.lawyerResponse && (
                  <p className="mt-3 rounded border border-gray-200 p-3 text-sm">
                    <b className="text-navy">{t("common.yourReply")}</b> {d.lawyerResponse}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

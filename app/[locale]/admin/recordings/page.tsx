import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { presignRecordingUrl } from "@/lib/storage";
import { bakuDateIso, fmtMin } from "@/lib/slots";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

function bakuTimeLabel(d: Date): string {
  const dayStart = new Date(`${bakuDateIso(d)}T00:00:00+04:00`).getTime();
  return fmtMin(Math.round((d.getTime() - dayStart) / 60_000));
}

export default async function AdminRecordingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const skip = (page - 1) * 30;
  const t = await getTranslations();
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const sessions = await prisma.consultSession.findMany({
    where: { recordingKey: { not: null } },
    orderBy: { createdAt: "desc" },
    include: {
      booking: {
        include: {
          client: { select: { fullName: true, phone: true } },
          lawyer: { select: { user: { select: { fullName: true } } } },
        },
      },
    },
    skip,
    take: 30 + 1,
  });
  const hasMore = sessions.length > 30;
  if (hasMore) sessions.pop();

  const rows = await Promise.all(
    sessions.map(async (s) => ({
      id: s.id,
      key: s.recordingKey as string,
      url: await presignRecordingUrl(s.recordingKey as string),
      startAt: s.booking.startAt,
      durationMin: s.booking.durationMin,
      client: s.booking.client.fullName ?? s.booking.client.phone ?? t("common.client"),
      lawyer: s.booking.lawyer.user.fullName ?? t("common.lawyer"),
      status: s.booking.status,
    }))
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">{t("admRec.title")}</h1>
      <p className="mt-2 text-sm">
        {t("admRec.subtitle")}
      </p>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-6 text-sm">
          {t("admRec.empty")}
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <div>
                <p className="text-sm font-medium text-navy">
                  {r.lawyer} × {r.client}
                </p>
                <p className="mt-1 text-sm">
                  {bakuDateIso(r.startAt)} · {bakuTimeLabel(r.startAt)} ·{" "}
                  {r.durationMin} {t("common.min")}
                </p>
                <p className="mt-1 text-xs text-slate">{r.key}</p>
              </div>
              {r.url ? (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
                >
                  {t("admRec.watch")}
                </a>
              ) : (
                <span className="text-xs text-slate">Konfiqurasiya yoxdur</span>
              )}
            </div>
          ))}
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

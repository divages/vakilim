import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";


export default async function AdminFlagsPage({
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

  const flagged = await prisma.message.findMany({
    where: { flagged: true },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { fullName: true, phone: true, role: true } },
      booking: {
        include: {
          client: { select: { fullName: true } },
          lawyer: { select: { user: { select: { fullName: true } } } },
        },
      },
    },
    skip,
    take: 30 + 1,
  });
  const hasMore = flagged.length > 30;
  if (hasMore) flagged.pop();

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">{t("nav.admFlags")}</h1>
      <p className="mt-2 text-sm">
        {t("admF.subtitle")}
      </p>

      {flagged.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-6 text-sm">
          {t("admF.empty")}
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {flagged.map((m) => (
            <div key={m.id} className="rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-navy">
                  {m.sender.fullName ?? m.sender.phone ?? t("admF.user")}{" "}
                  <span className="font-normal text-slate">
                    ({m.sender.role === "LAWYER" ? t("common.lawyer") : t("common.client")}) —{" "}
                    {m.booking.lawyer.user.fullName} ×{" "}
                    {m.booking.client.fullName}
                  </span>
                </p>
                <div className="flex gap-1">
                  {m.flagReasons.map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                    >
                      {t(`admF.reasons.${r}`)}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-2 rounded-xl bg-gray-50 p-3 text-sm">{m.body}</p>
              <p className="mt-1 text-xs text-slate">
                {m.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC
              </p>
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

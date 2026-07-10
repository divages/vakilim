import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HideToggle from "./hide-toggle";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function AdminReviewsPage({
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

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lawyer: { select: { user: { select: { fullName: true } } } },
      booking: { select: { client: { select: { fullName: true } } } },
    },
    skip,
    take: 30 + 1,
  });
  const hasMore = reviews.length > 30;
  if (hasMore) reviews.pop();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">{t("dash.revT")}</h1>
      <p className="mt-2 text-sm">
        {t("admRev.subtitle")}
      </p>

      {reviews.length === 0 ? (
        <p className="mt-6 rounded border border-gray-200 bg-gray-50 p-6 text-sm">
          {t("admRev.empty")}
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={`rounded border p-4 ${
                r.hidden ? "border-gray-200 bg-gray-50 opacity-70" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-navy">
                    {r.lawyer.user.fullName} ←{" "}
                    {(r.booking.client.fullName ?? t("common.client")).split(" ")[0]} ·{" "}
                    <span className="text-amber-500">{"★".repeat(r.stars)}</span>
                  </p>
                  {r.text && <p className="mt-2 text-sm">{r.text}</p>}
                  {r.lawyerReply && (
                    <p className="mt-2 text-xs text-slate">
                      {t("profile.reply")} {r.lawyerReply}
                    </p>
                  )}
                </div>
                <HideToggle id={r.id} hidden={r.hidden} />
              </div>
            </div>
          ))}
        </div>
      )}
      {hasMore && (
        <div className="mt-6 text-center">
          <Link
            href={`?page=${page + 1}`}
            className="inline-block rounded border border-gray-300 px-4 py-2 text-sm text-navy hover:border-navy"
          >
            {t("common.more")}
          </Link>
        </div>
      )}
    </div>
  );
}

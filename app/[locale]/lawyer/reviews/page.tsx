import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReplyForm from "./reply-form";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function LawyerReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const skip = (page - 1) * 30;
  const t = await getTranslations();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/lawyer/reviews");

  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) redirect("/lawyer/apply");

  const reviews = await prisma.review.findMany({
    where: { lawyerId: profile.id },
    orderBy: { createdAt: "desc" },
    include: {
      booking: { select: { client: { select: { fullName: true } } } },
    },
    skip,
    take: 30 + 1,
  });
  const hasMore = reviews.length > 30;
  if (hasMore) reviews.pop();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">{t("dash.revT")}</h1>
      <p className="mt-2 text-sm">
        {t("lawR.subtitle")}
      </p>

      {reviews.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-6 text-sm">
          {t("directory.noReviews")}
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-navy">
                  {(r.booking.client.fullName ?? t("common.client")).split(" ")[0]}
                </p>
                <p className="text-sm text-amber-500">
                  {"★".repeat(r.stars)}
                  <span className="text-gray-300">{"★".repeat(5 - r.stars)}</span>
                </p>
              </div>
              {r.tags.length > 0 && (
                <p className="mt-1 text-xs text-slate">
                  {r.tags.map((tag) => t(`common.tags.${tag}`)).join(" · ")}
                </p>
              )}
              {r.text && <p className="mt-2 text-sm">{r.text}</p>}
              {r.hidden && (
                <p className="mt-2 text-xs text-red-700">
                  {t("lawR.hidden")}
                </p>
              )}
              {r.lawyerReply ? (
                <p className="mt-3 rounded border-l-2 border-navy/30 bg-gray-50 p-2 text-sm">
                  <b className="text-navy">{t("common.yourReply")}</b> {r.lawyerReply}
                </p>
              ) : (
                <ReplyForm reviewId={r.id} />
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

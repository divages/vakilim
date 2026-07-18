import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAzn } from "@/lib/money";
import { getTranslations, getLocale } from "next-intl/server";
import { intlTag } from "@/lib/locale";
import { Link } from "@/i18n/navigation";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const skip = (page - 1) * 30;
  const t = await getTranslations();
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/documents");

  const orders = await prisma.docOrder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { templateVersion: { include: { template: true } } },
    skip,
    take: 30 + 1,
  });
  const hasMore = orders.length > 30;
  if (hasMore) orders.pop();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">{t("documents.title")}</h1>

      {orders.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-6 text-sm">
          {t("documents.empty")}{" "}
          <Link href="/templates" className="text-emerald underline">
            {t("documents.pick")}
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-navy">
                    {o.templateVersion.template.title}
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    № {o.docUid} ·{" "}
                    {o.createdAt.toLocaleDateString(intlTag(locale), {
                      timeZone: "Asia/Baku",
                    })}
                  </p>
                </div>
                <p className="text-sm font-semibold text-navy">
                  {o.priceQepik === 0 ? t("common.free") : formatAzn(o.priceQepik)}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {o.status === "PAID" ? (
                  <a
                    href={`/api/doc-orders/${o.id}/download`}
                    className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
                  >
                    {t("documents.download")}
                  </a>
                ) : (
                  <Link
                    href={`/doc-pay/${o.id}`}
                    className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark"
                  >
                    {t("documents.completePay")}
                  </Link>
                )}
                <Link
                  href={`/verify?code=${o.docUid}`}
                  className="rounded-xl border border-gray-100 px-4 py-2 text-sm text-navy hover:border-navy"
                >
                  {t("documents.verifyPage")}
                </Link>
              </div>
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

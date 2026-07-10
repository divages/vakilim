import { prisma } from "@/lib/prisma";
import { getTranslations, getLocale } from "next-intl/server";
import { intlTag } from "@/lib/locale";

export const metadata = {
  title: "Sənəd yoxlaması — Vakilim.az",
  description: "Vakilim.az sənədinin orijinallığını yoxlama kodu ilə təsdiqləyin.",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const t = await getTranslations();
  const locale = await getLocale();
  const { code } = await searchParams;
  const normalized = code?.trim().toUpperCase();

  const order = normalized
    ? await prisma.docOrder.findFirst({
        where: { docUid: normalized, status: "PAID" },
        include: { templateVersion: { include: { template: true } } },
      })
    : null;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-navy">{t("verify.title")}</h1>
      <p className="mt-2 text-sm">
        {t("verify.subtitle")}
      </p>

      <form method="GET" className="mt-6 flex gap-2">
        <input
          name="code"
          defaultValue={normalized ?? ""}
          placeholder="VKL-XXXX-XXXX"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm uppercase tracking-wider outline-none focus:border-navy"
        />
        <button className="rounded bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-navy-dark">
          {t("verify.check")}
        </button>
      </form>

      {normalized && (
        <div
          className={`mt-6 rounded border p-4 ${
            order
              ? "border-emerald/40 bg-emerald/10"
              : "border-red-200 bg-red-50"
          }`}
        >
          {order ? (
            <>
              <p className="font-medium text-navy">✓ {t("verify.valid")}</p>
              <p className="mt-2 text-sm">
                {order.templateVersion.template.title}
              </p>
              <p className="mt-1 text-xs text-slate">
                № {order.docUid} · {t("verify.createdAt")}{" "}
                {order.createdAt.toLocaleDateString(intlTag(locale), {
                  timeZone: "Asia/Baku",
                })}
              </p>
            </>
          ) : (
            <p className="font-medium text-red-700">
              {t("verify.notFound")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

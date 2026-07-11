import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const t = await getTranslations("home");
  const areas = await prisma.practiceArea.findMany({
    orderBy: { sortOrder: "asc" },
    take: 8,
    select: { id: true, slug: true, nameAz: true, nameRu: true, nameEn: true },
  });
  const locale = await getLocale();

  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="pt-20 pb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-navy md:text-5xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate">{t("subtitle")}</p>
        <form
          method="GET"
          action="/lawyers"
          className="mx-auto mt-8 flex max-w-xl items-center rounded-full border border-gray-200 bg-white p-2 shadow-lg shadow-gray-100"
        >
          <input
            name="q"
            placeholder={t("searchPlaceholder")}
            className="w-full flex-1 bg-transparent px-4 text-sm outline-none"
          />
          <button className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white">
            {t("search")}
          </button>
        </form>
        <Link
          href="/lawyers"
          className="mt-4 inline-block text-sm font-medium text-emerald hover:underline"
        >
          {t("allLawyers")}
        </Link>
        <div className="mt-6">
          <Link
            href="/intake"
            className="inline-block rounded-xl border border-emerald/40 bg-emerald-50/50 px-6 py-3 text-sm font-semibold text-emerald-700 hover:border-emerald transition"
          >
            {t("aiCta")}
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {areas.map((a) => (
            <Link
              key={a.id}
              href={`/areas/${a.slug}`}
              className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:border-emerald hover:text-emerald-700"
            >
              {locale === "ru"
                ? a.nameRu ?? a.nameAz
                : locale === "en"
                  ? a.nameEn ?? a.nameAz
                  : a.nameAz}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {([1, 2, 3] as const).map((i) => (
          <div key={i} className="rounded-2xl bg-emerald-50/60 p-6">
            <p className="font-semibold text-navy">{t(`stat${i}t`)}</p>
            <p className="mt-1 text-sm text-slate">{t(`stat${i}b`)}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 mb-8 rounded-3xl border border-gray-100 bg-gray-50/60 p-8 md:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-navy">{t("tplT")}</h2>
            <p className="mt-1 text-slate">{t("tplB")}</p>
          </div>
          <Link
            href="/templates"
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200"
          >
            {t("tplCta")}
          </Link>
        </div>
      </section>
    </div>
  );
}

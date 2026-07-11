import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("lawsTitle"),
    alternates: {
      canonical: `/${locale}/laws`,
      languages: { az: "/az/laws", ru: "/ru/laws", en: "/en/laws", "x-default": "/az/laws" },
    },
  };
}

function pickT(r: { titleAz: string; titleRu: string | null; titleEn: string | null }, locale: string) {
  if (locale === "ru") return r.titleRu ?? r.titleAz;
  if (locale === "en") return r.titleEn ?? r.titleAz;
  return r.titleAz;
}

export default async function LawsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const rows = await prisma.lawDoc.findMany({
    where: { publishedAt: { not: null, lte: new Date() } },
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
    select: { id: true, kind: true, slug: true, titleAz: true, titleRu: true, titleEn: true },
  });
  const codes = rows.filter((r) => r.kind === "CODE");
  const laws = rows.filter((r) => r.kind === "LAW");

  const Section = ({ title, items }: { title: string; items: typeof rows }) =>
    items.length === 0 ? null : (
      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-emerald">{title}</h2>
        <div className="mt-3 space-y-2">
          {items.map((r) => (
            <Link
              key={r.id}
              href={`/laws/${r.slug}`}
              className="block rounded-2xl border border-gray-100 bg-white px-5 py-4 font-medium text-navy shadow-sm transition hover:shadow-md"
            >
              {pickT(r, locale)} →
            </Link>
          ))}
        </div>
      </section>
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">{t("laws.title")}</h1>
      <p className="mt-2 text-slate">{t("laws.subtitle")}</p>
      {rows.length === 0 ? (
        <p className="mt-8 text-slate">{t("laws.empty")}</p>
      ) : (
        <>
          <Section title={t("laws.codes")} items={codes} />
          <Section title={t("laws.laws")} items={laws} />
        </>
      )}
      <p className="mt-10 text-xs text-slate">{t("laws.note")}</p>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { renderLiteMarkdown } from "@/lib/markdown-lite";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("qaTitle"),
    alternates: {
      canonical: `/${locale}/qa`,
      languages: { az: "/az/qa", ru: "/ru/qa", en: "/en/qa", "x-default": "/az/qa" },
    },
  };
}

function pickQ(row: Record<string, string | null>, field: string, locale: string): string {
  const az = row[`${field}Az`] as string;
  if (locale === "ru") return row[`${field}Ru`] ?? az;
  if (locale === "en") return row[`${field}En`] ?? az;
  return az;
}

export default async function QaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const rows = await prisma.qaEntry.findMany({
    where: { publishedAt: { not: null, lte: new Date() } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 300,
  });

  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const cat = pickQ(r as never, "category", locale) || t("qa.general");
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(r);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: rows.map((r) => ({
      "@type": "Question",
      name: pickQ(r as never, "question", locale),
      acceptedAnswer: {
        "@type": "Answer",
        text: pickQ(r as never, "answer", locale),
      },
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("qa.title")}
      </h1>
      <p className="mt-2 text-slate">{t("qa.subtitle")}</p>
      {rows.length === 0 ? (
        <p className="mt-8 text-slate">{t("qa.empty")}</p>
      ) : (
        [...groups.entries()].map(([cat, items]) => (
          <section key={cat} className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-emerald">
              {cat}
            </h2>
            <div className="mt-3 space-y-3">
              {items.map((r) => (
                <details
                  key={r.id}
                  className="group rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm open:shadow-md"
                >
                  <summary className="cursor-pointer list-none font-semibold text-navy">
                    {pickQ(r as never, "question", locale)}
                    <span className="float-right text-slate transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <div
                    className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700 [&_a]:text-emerald [&_a]:underline"
                    dangerouslySetInnerHTML={{
                      __html: renderLiteMarkdown(pickQ(r as never, "answer", locale)),
                    }}
                  />
                </details>
              ))}
            </div>
          </section>
        ))
      )}
      <p className="mt-10 text-xs text-slate">{t("intake.disclaimer")}</p>
    </div>
  );
}

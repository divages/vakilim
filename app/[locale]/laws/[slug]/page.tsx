import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { renderLiteMarkdown, extractToc } from "@/lib/markdown-lite";
import { pickL } from "@/lib/locale-pick";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const r = await prisma.lawDoc.findFirst({
    where: { slug, publishedAt: { not: null } },
    select: { titleAz: true, titleRu: true, titleEn: true },
  });
  if (!r) return {};
  return {
    title: pickL(r, "title", locale) + " — Vakilim.az",
    alternates: {
      canonical: `/${locale}/laws/${slug}`,
      languages: {
        az: `/az/laws/${slug}`,
        ru: `/ru/laws/${slug}`,
        en: `/en/laws/${slug}`,
        "x-default": `/az/laws/${slug}`,
      },
    },
  };
}

export default async function LawPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations();
  const r = await prisma.lawDoc.findFirst({
    where: { slug, publishedAt: { not: null, lte: new Date() } },
  });
  if (!r) notFound();
  const body = pickL(r, "body", locale);
  const toc = extractToc(body);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/laws" className="text-sm font-medium text-emerald hover:underline">
        ← {t("laws.back")}
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy">
        {pickL(r, "title", locale)}
      </h1>
      {toc.length > 1 && (
        <nav className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate">
            {t("laws.toc")}
          </p>
          <ol className="mt-2 space-y-1.5 text-sm">
            {toc.map((h) => (
              <li key={h.id}>
                <a href={`#${h.id}`} className="text-navy hover:text-emerald">
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div
        className="mt-8 space-y-4 leading-relaxed text-slate-700 [&_a]:text-emerald [&_a]:underline [&_h2]:mt-10 [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-navy [&_h3]:mt-6 [&_h3]:font-bold [&_h3]:text-navy"
        dangerouslySetInnerHTML={{ __html: renderLiteMarkdown(body, true) }}
      />
      <p className="mt-10 border-t border-gray-100 pt-4 text-xs text-slate">
        {t("laws.note")}
      </p>
    </div>
  );
}

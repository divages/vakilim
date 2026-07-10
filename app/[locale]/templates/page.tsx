import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatAzn } from "@/lib/money";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Hüquqi sənəd şablonları — Vakilim.az",
  description:
    "Hazır hüquqi sənədləri suallara cavab verməklə bir neçə dəqiqəyə yaradın.",
};

export default async function TemplatesPage() {
  const tr = await getTranslations();
  const templates = await prisma.docTemplate.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  const byCategory = new Map<string, typeof templates>();
  for (const t of templates) {
    const list = byCategory.get(t.category) ?? [];
    list.push(t);
    byCategory.set(t.category, list);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold text-navy">{tr("catalog.title")}</h1>
      <p className="mt-2 text-sm">
        {tr("catalog.subtitle")}
      </p>

      {[...byCategory.entries()].map(([category, list]) => (
        <div key={category}>
          <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-slate">
            {category}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {list.map((t) => (
              <Link
                key={t.id}
                href={`/templates/${t.slug}`}
                className="rounded border border-gray-200 p-4 transition hover:border-navy"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-navy">{t.title}</p>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      t.priceQepik === 0
                        ? "bg-emerald/15 text-navy"
                        : "bg-navy/5 text-navy"
                    }`}
                  >
                    {t.priceQepik === 0 ? tr("common.free") : formatAzn(t.priceQepik)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate">{t.description}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

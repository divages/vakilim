import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatAzn } from "@/lib/money";
import { getTranslations } from "next-intl/server";
import type { FieldDef } from "@/lib/doc-fields";

async function load(slug: string) {
  return prisma.docTemplate.findFirst({
    where: { slug, active: true },
    include: {
      versions: {
        where: { published: true },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await load(slug);
  if (!t) return { title: "Şablon tapılmadı — Vakilim.az" };
  return { title: `${t.title} — Vakilim.az`, description: t.description };
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tr = await getTranslations();
  const template = await load(slug);
  const version = template?.versions[0];
  if (!template || !version) notFound();

  const siblings = template.familyKey
    ? await prisma.docTemplate.findMany({
        where: {
          familyKey: template.familyKey,
          active: true,
          NOT: { id: template.id },
        },
        select: { slug: true, locale: true },
        orderBy: { locale: "asc" },
      })
    : [];

  const fields = version.fields as unknown as FieldDef[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-navy">{template.title}</h1>
        <span className="rounded-xl bg-navy/5 px-3 py-1.5 text-sm font-semibold text-navy">
          {template.priceQepik === 0 ? tr("common.free") : formatAzn(template.priceQepik)}
        </span>
      </div>
      <p className="mt-3 text-sm">{template.description}</p>

      <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-slate">
        {tr("tplDetail.need", { count: fields.length })}
      </h2>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
        {fields.map((f) => (
          <li key={f.key}>{f.labelAz}</li>
        ))}
      </ul>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-xs leading-relaxed text-slate">
        {tr("tplDetail.licenseNote")}
      </div>

      {siblings.length > 0 && (
        <p className="mt-4 text-sm">
          {tr("tplDetail.alsoIn")}{" "}
          {siblings.map((s, i) => (
            <span key={s.slug}>
              {i > 0 && " · "}
              <Link
                href={`/templates/${s.slug}`}
                className="text-emerald underline"
              >
                {tr(`common.langName.${s.locale}`)}
              </Link>
            </span>
          ))}
        </p>
      )}

      <Link
        href={`/templates/${template.slug}/fill`}
        className="mt-6 inline-block w-full rounded-xl bg-navy py-3 text-center font-medium text-white hover:bg-navy-dark"
      >
        {tr("tplDetail.start")}
      </Link>
    </div>
  );
}

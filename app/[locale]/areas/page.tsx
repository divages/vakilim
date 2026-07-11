import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { areaNameL } from "@/lib/locale-pick";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("areasTitle"),
    alternates: {
      canonical: `/${locale}/areas`,
      languages: { az: "/az/areas", ru: "/ru/areas", en: "/en/areas", "x-default": "/az/areas" },
    },
  };
}


export default async function AreasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const areas = await // unbounded-ok: naturally bounded set
  prisma.practiceArea.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          lawyers: { where: { lawyerProfile: { verificationStatus: "APPROVED" } } },
        },
      },
    },
  });
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("areas.title")}
      </h1>
      <p className="mt-2 text-slate">{t("areas.subtitle")}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((a) => (
          <Link
            key={a.id}
            href={`/areas/${a.slug}`}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="font-bold text-navy">{areaNameL(a, locale)}</p>
            <p className="mt-1 text-sm text-slate">
              {t("areas.count", { n: a._count.lawyers })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

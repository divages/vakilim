import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("aboutTitle"),
    alternates: {
      canonical: `/${locale}/about`,
      languages: { az: "/az/about", ru: "/ru/about", en: "/en/about", "x-default": "/az/about" },
    },
  };
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">{t("title")}</h1>
      <p className="mt-4 leading-relaxed text-slate-700">{t("mission")}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {(["verify", "prices", "languages"] as const).map((k) => (
          <div key={k} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="font-bold text-navy">{t(`${k}H`)}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate">{t(`${k}B`)}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 leading-relaxed text-slate-700">{t("closing")}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/how-it-works" className="rounded-xl bg-navy px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">
          {t("ctaHow")}
        </Link>
        <Link href="/contact" className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-navy hover:border-navy">
          {t("ctaContact")}
        </Link>
      </div>
    </div>
  );
}

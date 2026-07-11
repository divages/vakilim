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
    title: t("howTitle"),
    alternates: {
      canonical: `/${locale}/how-it-works`,
      languages: { az: "/az/how-it-works", ru: "/ru/how-it-works", en: "/en/how-it-works", "x-default": "/az/how-it-works" },
    },
  };
}

export default async function HowItWorksPage() {
  const t = await getTranslations("how");

  const Steps = ({ prefix }: { prefix: "c" | "l" }) => (
    <div className="mt-5 grid gap-4 sm:grid-cols-3">
      {([1, 2, 3] as const).map((n) => (
        <div key={n} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald text-sm font-bold text-white">
            {n}
          </span>
          <p className="mt-3 font-bold text-navy">{t(`${prefix}${n}H`)}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate">{t(`${prefix}${n}B`)}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">{t("title")}</h1>

      <h2 className="mt-10 text-sm font-bold uppercase tracking-wide text-emerald">
        {t("clientH")}
      </h2>
      <Steps prefix="c" />
      <Link href="/lawyers" className="mt-5 inline-block rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white hover:opacity-90">
        {t("clientCta")}
      </Link>

      <h2 className="mt-14 text-sm font-bold uppercase tracking-wide text-emerald">
        {t("lawyerH")}
      </h2>
      <Steps prefix="l" />
      <Link href="/signup" className="mt-5 inline-block rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-navy hover:border-navy">
        {t("lawyerCta")}
      </Link>

      <p className="mt-12 text-xs text-slate">{t("note")}</p>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import IntakeForm from "./intake-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("intakeTitle"),
    alternates: {
      canonical: `/${locale}/intake`,
      languages: { az: "/az/intake", ru: "/ru/intake", en: "/en/intake", "x-default": "/az/intake" },
    },
  };
}

export default async function IntakePage() {
  const t = await getTranslations();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("intake.title")}
      </h1>
      <p className="mt-3 text-slate">{t("intake.subtitle")}</p>
      <IntakeForm />
      <p className="mt-8 text-xs text-slate">{t("intake.disclaimer")}</p>
    </div>
  );
}

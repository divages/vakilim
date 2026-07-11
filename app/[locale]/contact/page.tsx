import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

// Official support channel — adjust here if the address differs.
const SUPPORT_EMAIL = "support@vakilim.az";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("contactTitle"),
    alternates: {
      canonical: `/${locale}/contact`,
      languages: { az: "/az/contact", ru: "/ru/contact", en: "/en/contact", "x-default": "/az/contact" },
    },
  };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">{t("title")}</h1>
      <p className="mt-3 text-slate">{t("subtitle")}</p>

      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate">
          {t("emailH")}
        </p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-1 inline-block text-xl font-bold text-emerald hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>
        <p className="mt-2 text-sm text-slate">{t("emailB")}</p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Link href="/qa" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <p className="font-bold text-navy">{t("qaH")}</p>
          <p className="mt-1 text-sm text-slate">{t("qaB")}</p>
        </Link>
        <Link href="/lawyer/apply" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <p className="font-bold text-navy">{t("lawyerH")}</p>
          <p className="mt-1 text-sm text-slate">{t("lawyerB")}</p>
        </Link>
      </div>
    </div>
  );
}

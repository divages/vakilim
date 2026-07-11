import { getTranslations } from "next-intl/server";
import Calc from "./fee-calc";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("feeCalcTitle"),
    // LAYİHƏ gate: flip to index + add to sitemap after the figures are
    // verified against e-qanun.az.
    robots: { index: false, follow: true },
    alternates: { canonical: `/${locale}/tools/rusum` },
  };
}

export default function Page() {
  return <Calc />;
}

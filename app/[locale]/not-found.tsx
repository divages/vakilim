import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations();
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-xl font-bold text-navy">{t("sys.nfTitle")}</h1>
      <p className="mt-3 text-sm text-slate">{t("sys.nfBody")}</p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-xl bg-navy px-5 py-2.5 text-sm font-medium text-white"
      >
        {t("sys.goHome")}
      </Link>
    </div>
  );
}

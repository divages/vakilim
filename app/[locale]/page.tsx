import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-navy">
        {t("title")}
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg">{t("subtitle")}</p>
      <form
        method="GET"
        action="/lawyers"
        className="mx-auto mt-8 flex max-w-md gap-2"
      >
        <input
          name="q"
          placeholder={t("searchPlaceholder")}
          className="w-full rounded border border-gray-300 px-4 py-3 text-sm outline-none focus:border-navy"
        />
        <button className="rounded bg-navy px-6 py-3 font-medium text-white hover:bg-navy-dark">
          {t("search")}
        </button>
      </form>
      <Link
        href="/lawyers"
        className="mt-4 inline-block text-sm text-emerald underline"
      >
        {t("allLawyers")}
      </Link>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations();
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">{t("sys.errTitle")}</h1>
      <p className="mt-3 text-sm text-slate">{t("sys.errBody")}</p>
      <button
        onClick={reset}
        className="mt-8 rounded-xl bg-navy px-5 py-2.5 text-sm font-medium text-white"
      >
        {t("sys.retry")}
      </button>
    </div>
  );
}

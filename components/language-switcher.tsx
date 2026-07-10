"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <span className="flex items-center gap-1 text-xs">
      {routing.locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-600/30">|</span>}
          <Link
            href={pathname}
            locale={l}
            className={
              l === locale
                ? "font-bold text-slate-600"
                : "text-slate-600/60 hover:text-slate-600"
            }
          >
            {l.toUpperCase()}
          </Link>
        </span>
      ))}
    </span>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const ITEMS = [
  { href: "/admin", key: "dash", exact: true },
  { href: "/admin/lawyers", key: "lawyers" },
  { href: "/admin/users", key: "users" },
  { href: "/admin/documents", key: "docs" },
  { href: "/admin/verifications", key: "ver" },
  { href: "/admin/disputes", key: "disp" },
  { href: "/admin/flags", key: "flags" },
  { href: "/admin/reviews", key: "rev" },
  { href: "/admin/recordings", key: "rec" },
  { href: "/admin/posts", key: "posts" },
  { href: "/admin/templates", key: "tpl" },
] as const;

export default function AdminNav() {
  const t = useTranslations("adminNav");
  const path = usePathname();
  const rest = path.replace(/^\/(az|ru|en)/, "") || "/";
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
      {ITEMS.map((i) => {
        const active =
          "exact" in i && i.exact ? rest === i.href : rest.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-navy text-white"
                : "text-slate-600 hover:bg-gray-50 hover:text-navy"
            }`}
          >
            {t(i.key)}
          </Link>
        );
      })}
    </nav>
  );
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./login-form";
import { getTranslations } from "next-intl/server";

function safePath(next: string | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("loginTitle"),
    description: t("loginDesc"),
    alternates: {
      canonical: `/${locale}/login`,
      languages: { az: "/az/login", ru: "/ru/login", en: "/en/login", "x-default": "/az/login" },
    },
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const t = await getTranslations();
  const { next } = await searchParams;
  const target = safePath(next);

  const user = await getCurrentUser();
  if (user) redirect(target);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-navy">{t("login.title")}</h1>
      <p className="mt-2 text-sm">
        {t("login.subtitle")}
      </p>
      <LoginForm next={target} />
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import LoginForm from "./login-form";

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

function safePath(v: string | undefined): string {
  if (!v || !v.startsWith("/") || v.startsWith("//")) return "/";
  return v;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; verify?: string; google?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <LoginForm next={safePath(sp.next)} verifyFailed={sp.verify === "failed"} googleError={sp.google ?? null} />
    </div>
  );
}

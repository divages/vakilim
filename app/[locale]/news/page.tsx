import { getTranslations } from "next-intl/server";
import PostList from "@/components/post-list";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("newsTitle"),
    alternates: {
      canonical: `/${locale}/news`,
      languages: { az: "/az/news", ru: "/ru/news", en: "/en/news", "x-default": "/az/news" },
    },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  return <PostList kind="NEWS" locale={locale} page={page} />;
}

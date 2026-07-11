import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/posts";
import PostArticle from "@/components/post-article";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const p = await prisma.post.findFirst({
    where: { kind: "NEWS", slug, publishedAt: { not: null } },
  });
  if (!p) return {};
  return {
    title: pick(p, "title", p as never, locale) + " — Vakilim.az",
    description: pick(p, "excerpt", p as never, locale),
    alternates: {
      canonical: `/${locale}/news/${slug}`,
      languages: {
        az: `/az/news/${slug}`,
        ru: `/ru/news/${slug}`,
        en: `/en/news/${slug}`,
        "x-default": `/az/news/${slug}`,
      },
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  return <PostArticle kind="NEWS" slug={slug} locale={locale} />;
}

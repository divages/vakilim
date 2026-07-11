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
    where: { kind: "BLOG", slug, publishedAt: { not: null } },
  });
  if (!p) return {};
  return {
    title: pick(p, "title", p as never, locale) + " — Vakilim.az",
    description: pick(p, "excerpt", p as never, locale),
    alternates: {
      canonical: `/${locale}/blog/${slug}`,
      languages: {
        az: `/az/blog/${slug}`,
        ru: `/ru/blog/${slug}`,
        en: `/en/blog/${slug}`,
        "x-default": `/az/blog/${slug}`,
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
  return <PostArticle kind="BLOG" slug={slug} locale={locale} />;
}

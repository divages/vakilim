import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/posts";
import { renderLiteMarkdown } from "@/lib/markdown-lite";
import type { PostKind } from "@/generated/prisma/client";

export default async function PostArticle({
  kind,
  slug,
  locale,
}: {
  kind: PostKind;
  slug: string;
  locale: string;
}) {
  const p = await prisma.post.findFirst({
    where: { kind, slug, publishedAt: { not: null, lte: new Date() } },
  });
  if (!p) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs text-slate">
        {p.publishedAt!.toISOString().slice(0, 10)}
        {p.authorName ? ` · ${p.authorName}` : ""}
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">
        {pick(p, "title", locale)}
      </h1>
      {p.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.coverUrl}
          alt=""
          className="mt-6 max-h-96 w-full rounded-2xl object-cover"
        />
      )}
      <div
        className="prose-vakilim mt-8 space-y-4 leading-relaxed text-slate-700 [&_a]:text-emerald [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-navy [&_h3]:mt-6 [&_h3]:font-bold [&_h3]:text-navy"
        dangerouslySetInnerHTML={{
          __html: renderLiteMarkdown(pick(p, "body", locale)),
        }}
      />
    </article>
  );
}

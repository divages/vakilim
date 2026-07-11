import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildIntakePrompt, parseIntake } from "@/lib/intake";

const bodySchema = z.object({
  text: z.string().min(20).max(1200),
  locale: z.enum(["az", "ru", "en"]).default("az"),
});

function areaName(a: { nameAz: string; nameRu: string | null; nameEn: string | null }, locale: string) {
  if (locale === "ru") return a.nameRu ?? a.nameAz;
  if (locale === "en") return a.nameEn ?? a.nameAz;
  return a.nameAz;
}

export async function POST(req: Request) {
  if (!checkRateLimit(req, "intake", 5, 10 * 60_000))
    return NextResponse.json({ ok: false, error: "TOO_MANY_REQUESTS" }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  const { text, locale } = parsed.data;

  const areas = await // unbounded-ok: naturally bounded set
  prisma.practiceArea.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, nameAz: true, nameRu: true, nameEn: true },
  });
  const options = areas.map((a) => ({ slug: a.slug, name: a.nameAz }));
  const validSlugs = new Set(options.map((o) => o.slug));

  const key = process.env.ANTHROPIC_API_KEY;
  let result: { areaSlug: string; summary: string; question: string } | null;

  if (!key) {
    // Demo fallback — keeps the flow alive without a key; the real
    // brain switches on with one env var.
    const first = areas[0];
    result = {
      areaSlug: first?.slug ?? "other",
      summary: "[AI DEV] " + text.slice(0, 120),
      question: "[AI DEV] " + text.slice(0, 120),
    };
  } else {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5",
          max_tokens: 600,
          messages: [
            { role: "user", content: buildIntakePrompt(text, locale, options) },
          ],
        }),
      });
      if (!res.ok) {
        console.error("intake: anthropic", res.status, await res.text());
        return NextResponse.json({ ok: false, error: "AI_UNAVAILABLE" }, { status: 502 });
      }
      const data = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const raw = data.content?.map((c) => c.text ?? "").join("") ?? "";
      result = parseIntake(raw, validSlugs);
    } catch (e) {
      console.error("intake: fetch failed", e);
      return NextResponse.json({ ok: false, error: "AI_UNAVAILABLE" }, { status: 502 });
    }
  }
  if (!result)
    return NextResponse.json({ ok: false, error: "AI_UNAVAILABLE" }, { status: 502 });

  const matchedArea = areas.find((a) => a.slug === result.areaSlug) ?? null;
  const lawyers = matchedArea
    ? await prisma.lawyerProfile.findMany({
        where: {
          verificationStatus: "APPROVED",
          slug: { not: null },
          practiceAreas: { some: { practiceArea: { slug: matchedArea.slug } } },
        },
        take: 3,
        include: {
          user: { select: { fullName: true } },
          services: { where: { active: true }, select: { priceQepik: true } },
          reviews: { where: { hidden: false }, select: { stars: true } },
        },
      })
    : [];

  return NextResponse.json({
    ok: true,
    area: matchedArea
      ? { slug: matchedArea.slug, name: areaName(matchedArea, locale) }
      : null,
    summary: result.summary,
    question: result.question,
    lawyers: lawyers.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.user.fullName ?? "—",
      type: p.type,
      city: p.city,
      hasPhoto: !!p.photoKey,
      minPriceQepik:
        p.services.length > 0
          ? Math.min(...p.services.map((s) => s.priceQepik))
          : null,
      ratingAvg:
        p.reviews.length > 0
          ? p.reviews.reduce((a, r) => a + r.stars, 0) / p.reviews.length
          : null,
      reviewCount: p.reviews.length,
    })),
  });
}

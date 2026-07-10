import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = "https://vakilim.az";
const LOCALES = ["az", "ru", "en"] as const;
const STATIC = ["", "/lawyers", "/templates", "/verify", "/login", "/terms", "/privacy", "/refund-policy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [profiles, templates] = await Promise.all([
    prisma.lawyerProfile.findMany({
      where: { verificationStatus: "APPROVED" },
      select: { slug: true },
      take: 5000,
    }),
    prisma.docTemplate.findMany({
      where: { active: true },
      select: { slug: true },
      take: 5000,
    }),
  ]);
  const rows: MetadataRoute.Sitemap = [];
  for (const l of LOCALES) {
    for (const p of STATIC)
      rows.push({ url: `${BASE}/${l}${p}`, changeFrequency: "weekly" });
    for (const pr of profiles)
      rows.push({
        url: `${BASE}/${l}/lawyers/${pr.slug}`,
        changeFrequency: "weekly",
      });
    for (const t of templates)
      rows.push({ url: `${BASE}/${l}/templates/${t.slug}`, changeFrequency: "monthly" });
  }
  return rows;
}

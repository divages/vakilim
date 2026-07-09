import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const AREAS = [
  { slug: "criminal", nameAz: "Cinayət", nameEn: "Criminal" },
  { slug: "administrative", nameAz: "İnzibati", nameEn: "Administrative" },
  { slug: "civil", nameAz: "Mülki", nameEn: "Civil" },
  { slug: "family", nameAz: "Ailə", nameEn: "Family" },
  { slug: "labor", nameAz: "Əmək", nameEn: "Labor" },
  { slug: "tax", nameAz: "Vergi", nameEn: "Tax" },
  { slug: "corporate", nameAz: "Korporativ və kommersiya", nameEn: "Corporate & Commercial" },
  { slug: "ip", nameAz: "Əqli mülkiyyət", nameEn: "Intellectual Property" },
  { slug: "migration", nameAz: "Miqrasiya", nameEn: "Migration" },
  { slug: "real-estate", nameAz: "Daşınmaz əmlak", nameEn: "Real Estate" },
  { slug: "inheritance", nameAz: "Vərəsəlik", nameEn: "Inheritance" },
  { slug: "consumer", nameAz: "İstehlakçı hüquqları", nameEn: "Consumer Protection" },
  { slug: "traffic", nameAz: "Yol-nəqliyyat", nameEn: "Traffic & Transport" },
  { slug: "military", nameAz: "Hərbi xidmət", nameEn: "Military Service" },
  { slug: "other", nameAz: "Digər", nameEn: "Other" },
];

async function main() {
  for (const [i, area] of AREAS.entries()) {
    await prisma.practiceArea.upsert({
      where: { slug: area.slug },
      update: { nameAz: area.nameAz, nameEn: area.nameEn, sortOrder: i },
      create: { ...area, sortOrder: i },
    });
  }
  console.log(`Seeded ${AREAS.length} practice areas`);
}

main().finally(() => prisma.$disconnect());
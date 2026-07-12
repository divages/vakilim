// ═══════════════════════════════════════════════════════════════════
// Vakilim.az — demo seed. DESTRUCTIVE: wipes EVERY table, then seeds:
//   1 admin · 10 practice areas · 50 lawyers (+services/availability)
//   30 doc templates (10 families × az/ru/en) · 20 clients
// Run:  npx tsx prisma/seed-demo.ts --yes
// (tsx transpiles the TS-emitted Prisma 7 client and honors tsconfig paths)
// ═══════════════════════════════════════════════════════════════════
import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";

// minimal .env loader (tsx does not read env files)
try {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined)
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env — rely on the shell environment */
}


if (!process.argv.includes("--yes")) {
  console.error("REFUSING: this wipes the ENTIRE database at DATABASE_URL.");
  console.error("Re-run with --yes if that is truly what you want:");
  console.error("  npx tsx prisma/seed-demo.ts --yes");
  process.exit(1);
}

// ── tiny deterministic RNG so reruns produce the same demo world ──
let s = 42;
const rnd = () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));

// ── name & data pools ──
const MALE = ["Elvin","Rəşad","Tural","Kamran","Orxan","Anar","Vüqar","Samir","Nicat","Fərid","Elnur","Ramin","Rüfət","Cavid","Emil","Murad","Toğrul","Zaur","İlqar","Pərviz","Şahin","Elşən","Rauf","Tərlan","Nihad"];
const FEMALE = ["Aysel","Günel","Nigar","Leyla","Sevinc","Aytən","Lalə","Nərmin","Zeynəb","Fidan","Türkan","Gülnar","Aygün","Səbinə","Xəyalə","Nurlanə","İlahə","Röya","Mehriban","Şəfəq","Ülviyyə","Arzu","Könül","Vüsalə","Cəmilə"];
const SURN_M = ["Məmmədov","Əliyev","Hüseynov","Quliyev","Həsənov","İsmayılov","Kərimov","Rəhimov","Bayramov","Cəfərov","Nəbiyev","Mustafayev","Abbasov","Sultanov","Xəlilov"];
const SURN_F = SURN_M.map((x) => x + "a");
const CITIES = ["Bakı","Bakı","Bakı","Bakı","Bakı","Sumqayıt","Gəncə","Şəki","Lənkəran","Mingəçevir"];
const LANGS = [["az"],["az"],["az","ru"],["az","ru"],["az","en"],["az","ru","en"]];

const AREAS: [string, string, string, string][] = [
  ["aile-huququ","Ailə hüququ","Семейное право","Family law"],
  ["emek-huququ","Əmək hüququ","Трудовое право","Labor law"],
  ["mulki-huquq","Mülki hüquq","Гражданское право","Civil law"],
  ["cinayet-huququ","Cinayət hüququ","Уголовное право","Criminal law"],
  ["inzibati-huquq","İnzibati hüquq","Административное право","Administrative law"],
  ["biznes-huququ","Biznes və müqavilələr","Бизнес и договоры","Business & contracts"],
  ["dasinmaz-emlak","Daşınmaz əmlak","Недвижимость","Real estate"],
  ["miqrasiya","Miqrasiya hüququ","Миграционное право","Migration law"],
  ["vergi-huququ","Vergi hüququ","Налоговое право","Tax law"],
  ["icra-huququ","İcra və borclar","Исполнение и долги","Enforcement & debt"],
];

const TR: Record<string, string> = { "ə":"e","Ə":"e","ı":"i","İ":"i","ö":"o","Ö":"o","ü":"u","Ü":"u","ş":"s","Ş":"s","ç":"c","Ç":"c","ğ":"g","Ğ":"g" };
const slugify = (t: string) => t.split("").map((c) => TR[c] ?? c).join("").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

type Fam = [string, string, number, [string, string, string], [string, string, string]];
const FAMILIES: Fam[] = [
  ["icare","Müqavilələr",1500,["Mənzil icarəsi müqaviləsi","Договор аренды квартиры","Apartment lease agreement"],["Mənzilin icarəsi üçün standart müqavilə.","Стандартный договор аренды жилья.","Standard residential lease."]],
  ["alqi-satqi","Müqavilələr",2000,["Alqı-satqı müqaviləsi","Договор купли-продажи","Sale-purchase agreement"],["Daşınar əmlakın alqı-satqısı üçün.","Для купли-продажи движимого имущества.","For sale of movable property."]],
  ["borc","Müqavilələr",1200,["Borc müqaviləsi","Договор займа","Loan agreement"],["Fiziki şəxslər arasında borc.","Заём между физическими лицами.","Loan between individuals."]],
  ["xidmet","Müqavilələr",1800,["Xidmət müqaviləsi","Договор оказания услуг","Service agreement"],["Xidmətlərin göstərilməsi üçün.","Для оказания услуг.","For provision of services."]],
  ["erize-mehkeme","Ərizələr",1000,["Məhkəməyə iddia ərizəsi","Исковое заявление в суд","Statement of claim"],["Birinci instansiya üçün iddia ərizəsi.","Иск в суд первой инстанции.","Claim for the first-instance court."]],
  ["erize-isden","Ərizələr",800,["İşdən çıxma ərizəsi","Заявление об увольнении","Resignation letter"],["Öz xahişi ilə işdən azad olma.","Увольнение по собственному желанию.","Voluntary resignation."]],
  ["etibarname","Etibarnamələr",900,["Sadə etibarnamə","Простая доверенность","Simple power of attorney"],["Nümayəndəlik üçün etibarnamə.","Доверенность на представительство.","PoA for representation."]],
  ["sikayet","Şikayətlər",1000,["İnzibati şikayət","Административная жалоба","Administrative complaint"],["Dövlət orqanının qərarından şikayət.","Жалоба на решение госоргана.","Complaint against a state body."]],
  ["pretenziya","Şikayətlər",900,["Pretenziya məktubu","Претензионное письмо","Demand letter"],["Məhkəməyəqədər tələb məktubu.","Досудебная претензия.","Pre-litigation demand."]],
  ["akt","Aktlar",700,["Təhvil-təslim aktı","Акт приёма-передачи","Handover act"],["Əmlakın təhvili üçün akt.","Акт передачи имущества.","Property handover act."]],
];
const FALLBACK_FIELDS = [
  { key: "party1", label: "Tərəf 1 — tam ad", type: "text", required: true },
  { key: "party2", label: "Tərəf 2 — tam ad", type: "text", required: true },
  { key: "docDate", label: "Tarix", type: "date", required: true },
  { key: "amount", label: "Məbləğ (AZN)", type: "money", required: false },
  { key: "details", label: "Əlavə şərtlər", type: "text", required: false },
];

async function main() {
  // the app's own client singleton — the only constructor that knows the
  // Prisma 7 driver-adapter options; env is already loaded by this point
  const { prisma } = await import("@/lib/prisma");

  // ── 0. harvest the field-schema mold from the outgoing templates ──
  let moldFields: unknown = FALLBACK_FIELDS;
  let moldBody =
    "MÜQAVİLƏ\n\nTərəflər: {{party1}} və {{party2}}.\nTarix: {{docDate}}.\nMəbləğ: {{amount}} AZN.\n\nŞərtlər: {{details}}\n\nİmzalar: ______________  ______________";
  try {
    const old = await prisma.templateVersion.findFirst({
      where: { published: true },
      orderBy: { createdAt: "asc" },
    });
    if (old?.fields && Array.isArray(old.fields) && (old.fields as unknown[]).length) {
      moldFields = old.fields;
      moldBody = old.bodyText || moldBody;
      console.log("mold: harvested field schema from existing template ✓");
    } else {
      console.log("mold: no existing template found — using fallback schema");
    }
  } catch {
    console.log("mold: harvest failed — using fallback schema");
  }

  // ── 1. WIPE ──
  const tables = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'`
  );
  const list = tables.map((t) => `"${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
  console.log(`wipe: truncated ${tables.length} tables ✓`);

  // ── 2. practice areas ──
  const areaRows = [] as { id: string; nameAz: string; nameRu: string | null; nameEn: string | null }[];
  for (let i = 0; i < AREAS.length; i++) {
    const [slug, az, ru, en] = AREAS[i];
    areaRows.push(
      await prisma.practiceArea.create({
        data: { slug, nameAz: az, nameRu: ru, nameEn: en, sortOrder: i },
      })
    );
  }
  console.log(`areas: ${areaRows.length} ✓`);

  // ── 3. admin ──
  const now = new Date();
  await prisma.user.create({
    data: {
      role: "ADMIN",
      phone: "+16505500808",
      email: "contact@appliance-suregon.com",
      passwordHash: bcrypt.hashSync("Vakilim.az", 10),
      emailVerifiedAt: now,
      phoneVerifiedAt: now,
      fullName: "Site Admin",
      locale: "az",
    },
  });
  console.log("admin: contact@appliance-suregon.com / Vakilim.az (+16505500808) ✓");

  // ── 4. 50 lawyers ──
  const usedPhones = new Set(["+16505500808"]);
  const usedSlugs = new Set<string>();
  const phone994 = () => {
    for (;;) {
      const p = `+994${pick(["50","51","55","70","77"])}${String(int(1000000, 9999999))}`;
      if (!usedPhones.has(p)) { usedPhones.add(p); return p; }
    }
  };
  let approved = 0, pending = 0, rejected = 0;
  for (let i = 0; i < 50; i++) {
    const female = rnd() < 0.5;
    const first = pick(female ? FEMALE : MALE);
    const last = pick(female ? SURN_F : SURN_M);
    const fullName = `${first} ${last}`;
    let slug = slugify(fullName);
    while (usedSlugs.has(slug)) slug = `${slugify(fullName)}-${int(2, 99)}`;
    usedSlugs.add(slug);

    const status = i < 46 ? "APPROVED" : i < 49 ? "PENDING" : "REJECTED";
    if (status === "APPROVED") approved++; else if (status === "PENDING") pending++; else rejected++;

    const nAreas = int(2, 3);
    const chosen = [...areaRows].sort(() => rnd() - 0.5).slice(0, nAreas);
    const years = int(2, 28);

    const user = await prisma.user.create({
      data: { role: "LAWYER", phone: phone994(), phoneVerifiedAt: now, fullName, locale: "az" },
    });
    const profile = await prisma.lawyerProfile.create({
      data: {
        userId: user.id,
        type: rnd() < 0.6 ? "ADVOCATE" : "LICENSED_LAWYER",
        verificationStatus: status,
        slug: status === "APPROVED" ? slug : null,
        reviewedAt: status === "PENDING" ? null : now,
        rejectionReason: status === "REJECTED" ? "Sənədlər natamamdır" : null,
        licenseNo: `AZ-${int(1000, 9999)}`,
        bioAz: `${chosen[0].nameAz} üzrə ${years} illik təcrübə. Məsləhət və məhkəmə təmsilçiliyi.`,
        bioRu: `Опыт ${years} лет: ${chosen[0].nameRu}. Консультации и представительство в суде.`,
        bioEn: `${years} years in ${chosen[0].nameEn}. Consultations and court representation.`,
        yearsExperience: years,
        city: pick(CITIES),
        bufferMin: pick([0, 0, 10, 15]),
        languages: pick(LANGS),
        practiceAreas: {
          create: chosen.map((a) => ({ practiceArea: { connect: { id: a.id } } })),
        },
      },
    });

    if (status === "APPROVED") {
      await prisma.service.create({
        data: {
          lawyerId: profile.id,
          type: "VIDEO",
          durationMin: pick([30, 30, 45, 60]),
          priceQepik: int(30, 150) * 100,
        },
      });
      if (rnd() < 0.6) {
        await prisma.service.create({
          data: { lawyerId: profile.id, type: "WRITTEN", durationMin: null, priceQepik: int(20, 80) * 100 },
        });
      }
      const days = [1, 2, 3, 4, 5].sort(() => rnd() - 0.5).slice(0, int(3, 5));
      for (const wd of days) {
        const start = pick([540, 600, 600, 660]);
        const end = start + pick([360, 420, 480]);
        await prisma.availabilityRule.create({
          data: { lawyerId: profile.id, weekday: wd, startMin: start, endMin: Math.min(end, 1140) },
        });
      }
    }
  }
  console.log(`lawyers: 50 (${approved} approved · ${pending} pending · ${rejected} rejected) + services + availability ✓`);

  // ── 5. 30 templates (10 families × 3 locales) ──
  let tCount = 0;
  for (let f = 0; f < FAMILIES.length; f++) {
    const [key, category, price, titles, descs] = FAMILIES[f];
    const locales = ["az", "ru", "en"] as const;
    for (let li = 0; li < 3; li++) {
      const tpl = await prisma.docTemplate.create({
        data: {
          slug: `${key}-${locales[li]}`,
          title: titles[li],
          description: descs[li],
          locale: locales[li],
          familyKey: key,
          category,
          priceQepik: price,
          active: true,
          sortOrder: f,
        },
      });
      await prisma.templateVersion.create({
        data: {
          templateId: tpl.id,
          version: 1,
          bodyText: moldBody,
          fields: moldFields as never,
          published: true,
        },
      });
      tCount++;
    }
  }
  console.log(`templates: ${tCount} (10 families × az/ru/en) ✓`);

  // ── 6. 20 clients ──
  const clientHash = bcrypt.hashSync("Valikim.az", 10); // literal per spec — note the l/k
  const usedMails = new Set(["contact@appliance-suregon.com"]);
  for (let i = 0; i < 20; i++) {
    const female = rnd() < 0.5;
    const first = pick(female ? FEMALE : MALE);
    const last = pick(female ? SURN_F : SURN_M);
    let email = `${slugify(first)}.${slugify(last)}@example.com`;
    while (usedMails.has(email)) email = `${slugify(first)}.${slugify(last)}${int(2, 99)}@example.com`;
    usedMails.add(email);
    await prisma.user.create({
      data: {
        role: "CLIENT",
        phone: phone994(),
        phoneVerifiedAt: now,
        email,
        emailVerifiedAt: now,
        passwordHash: clientHash,
        fullName: `${first} ${last}`,
        locale: pick(["az", "az", "az", "ru"]),
      },
    });
  }
  console.log("clients: 20 (+994 phones, password: Valikim.az) ✓");

  console.log("\n═══ SEED COMPLETE ═══");
  console.log("Admin login:  contact@appliance-suregon.com / Vakilim.az  → 2FA code to +16505500808 (echoed in dev)");
  console.log("Any client:   <listed email> / Valikim.az  · lawyers sign in via phone code");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

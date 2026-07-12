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

const EMEK_BODY = `## Ümumi müddəalar

Azərbaycan Respublikası Konstitusiyasının 35-ci maddəsinə əsasən əmək fərdi və ictimai rifahın əsasıdır. Hər kəsin əməyə olan qabiliyyəti əsasında sərbəst surətdə özünə fəaliyyət növü, peşə, məşğuliyyət və iş yeri seçmək hüququ vardır.

## Maddə 2. Əmək Məcəlləsinin vəzifələri və prinsipləri

1. Azərbaycan Respublikasının Əmək Məcəlləsi işçilərlə işəgötürənlər arasında yaranan əmək münasibətlərini, habelə onlarla müvafiq dövlət hakimiyyəti orqanları, hüquqi şəxslər arasında həmin münasibətlərdən törəyən digər hüquq münasibətlərini tənzim edir.

2. Azərbaycan Respublikasının Əmək Məcəlləsi fiziki şəxslərin əmək hüquqlarının və bu hüquqların həyata keçirilməsini təmin edən qaydaların minimum normalarını müəyyən edir.

## Maddə 3. Əsas anlayışlar

**İşçi** — işəgötürənlə fərdi qaydada yazılı əmək müqaviləsi (kontrakt) bağlayaraq müvafiq iş yerində haqqı ödənilməklə çalışan fiziki şəxs.

**İşəgötürən** — tam fəaliyyət qabiliyyətli olub işçilərlə əmək müqaviləsi bağlamaq, ona xitam vermək, yaxud onun şərtlərini dəyişdirmək hüququna malik olan şəxs.

**Müəssisə** — mülkiyyətçinin təşkilati-hüquqi formasından, adından və fəaliyyət növündən asılı olmayaraq qanunvericiliyə müvafiq olaraq yaratdığı hüquqi şəxs, onun filialı, nümayəndəliyi.

---

*Mənbə və tam rəsmi mətn:* [e-qanun.az/framework/46943](https://e-qanun.az/framework/46943)
`;

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
      email: "javid@vakilim.az",
      passwordHash: bcrypt.hashSync("Vakilim.az", 10),
      emailVerifiedAt: now,
      phoneVerifiedAt: now,
      fullName: "Site Admin",
      locale: "az",
    },
  });
  console.log("admin: javid@vakilim.az / Vakilim.az (+16505500808) ✓");

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
  const approvedProfiles: { id: string; name: string }[] = [];
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
      approvedProfiles.push({ id: profile.id, name: fullName });
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

  // ── 5b. blog & news + lawyer articles ──
  const P = (az: string, ru: string, en: string) => [az, ru, en] as const;
  const PLATFORM: [readonly [string,string,string], readonly [string,string,string], "BLOG"|"NEWS", string | null][] = [
    [P("Bosanma prosesi: addim-addim beledci","Развод: пошаговый гид","Divorce, step by step"), P("Erizeden qerara qeder — ne gozlemek lazimdir.","От заявления до решения — чего ожидать.","From filing to decision — what to expect."), "BLOG", "aile-huququ"],
    [P("Isden cixarilma: huquqlariniz","Увольнение: ваши права","Dismissal: your rights"), P("Qanunsuz xitamda kompensasiya yollari.","Компенсация при незаконном увольнении.","Compensation for unlawful dismissal."), "BLOG", "emek-huququ"],
    [P("Icare muqavilesinde 7 vacib bend","7 пунктов договора аренды","7 key lease clauses"), P("Kiraceci ve mulk sahibi ucun.","Для арендатора и владельца.","For tenants and landlords."), "BLOG", "dasinmaz-emlak"],
    [P("Vergi yoxlamasina hazirliq","Подготовка к налоговой проверке","Preparing for a tax audit"), P("Senedler, muddetler, huquqlar.","Документы, сроки, права.","Documents, deadlines, rights."), "BLOG", "vergi-huququ"],
    [P("Miqrasiya statusu: tez-tez suallar","Миграционный статус: FAQ","Migration status FAQ"), P("Icazeler ve muddetler barede.","О разрешениях и сроках.","On permits and periods."), "BLOG", "miqrasiya"],
    [P("Borc muqavilesi nece tertib olunur","Как оформить договор займа","Drafting a loan agreement"), P("Faiz, muddet, teminat.","Проценты, срок, обеспечение.","Interest, term, security."), "BLOG", "mulki-huquq"],
    [P("Vakilim.az beta merheleye kecdi","Vakilim.az вышел в бету","Vakilim.az enters beta"), P("Ilk istifadeciler ucun qapilar aciqdir.","Двери открыты для первых пользователей.","Doors open for first users."), "NEWS", null],
    [P("Yeni sahe sehifeleri ise dusdu","Запущены страницы областей права","Practice-area pages are live"), P("Her sahe uzre vekiller ve materiallar bir yerde.","Юристы и материалы по каждой области.","Lawyers and materials per area."), "NEWS", null],
    [P("Sened kataloqu genislendi","Каталог документов расширен","Document catalog expanded"), P("30 yeni sablon uc dilde.","30 новых шаблонов на трёх языках.","30 new templates in three languages."), "NEWS", null],
    [P("Video goruslerde yazi funksiyasi","Запись видеовстреч","Call recording arrives"), P("Raziliq esasinda, 30 gun saxlama ile.","С согласия сторон, хранение 30 дней.","Consent-based, 30-day retention."), "NEWS", null],
  ];
  const mdBody = (titleAz: string) =>
    "## " + titleAz + "\n\nBu material **melumat xarakterlidir** ve huquqi meslehet deyil. Konkret veziyyet ucun [vekil tapin](https://vakilim.az/az/lawyers).\n\n## Esas meqamlar\n\nProsesin gedisi, teleb olunan senedler ve muddetler barede umumi beledci. Her hal ferdidir - peshekar rey vacibdir.";
  let postN = 0;
  for (const [titles, excerpts, kind, area] of PLATFORM) {
    postN++;
    await prisma.post.create({
      data: {
        kind,
        slug: slugify(titles[0]) + "-" + postN,
        titleAz: titles[0], titleRu: titles[1], titleEn: titles[2],
        excerptAz: excerpts[0], excerptRu: excerpts[1], excerptEn: excerpts[2],
        bodyAz: mdBody(titles[0]),
        bodyRu: "## " + titles[1] + "\n\nОбзорный материал. **Не является юридической консультацией.**",
        bodyEn: "## " + titles[2] + "\n\nAn overview. **Not legal advice.**",
        coverUrl: "https://picsum.photos/seed/vakilim" + postN + "/800/450",
        authorName: "Vakilim.az",
        practiceAreaSlug: area,
        publishedAt: new Date(Date.now() - postN * 86_400_000),
      },
    });
  }
  const authors = [...approvedProfiles].sort(() => rnd() - 0.5).slice(0, 11);
  for (let i = 0; i < authors.length; i++) {
    const a = authors[i];
    const published = i < 8;
    await prisma.post.create({
      data: {
        kind: "BLOG",
        slug: "meqale-" + slugify(a.name) + "-" + (i + 1),
        titleAz: "Praktikadan: " + pick(["ilk mehkeme iclasi","muqavile yoxlanisi","apellyasiya tecrubesi","danisiqlarin sirleri"]),
        excerptAz: "Vekil tecrubesinden qisa qeydler ve tovsiyeler.",
        bodyAz: "## Tecrubeden qeydler\n\n**" + a.name + "** praktik mesleheler bolusur.\n\nHer is ferdidir; buradaki fikirler umumi istiqamet ucundur.",
        authorLawyerId: a.id,
        authorName: a.name,
        practiceAreaSlug: pick(AREAS)[0],
        publishedAt: published ? new Date(Date.now() - (i + 2) * 43_200_000) : null,
      },
    });
  }
  console.log("posts: " + PLATFORM.length + " platform + " + authors.length + " lawyer articles (8 live, 3 in review)");

  // ── 5c. laws (real text from e-qanun.az; laws are official acts, public domain) ──
  const LAW_DOCS = [
    {
      slug: "emek-mecellesi",
      kind: "CODE" as const,
      titleAz: "Az\u0259rbaycan Respublikas\u0131n\u0131n \u018fm\u0259k M\u0259c\u0259ll\u0259si",
      titleRu: "Трудовой кодекс Азербайджанской Республики",
      titleEn: "Labor Code of the Republic of Azerbaijan",
      cat: "M\u0259c\u0259ll\u0259l\u0259r",
      url: "https://e-qanun.az/framework/46943",
      body: EMEK_BODY,
    },
    {
      slug: "mulki-mecelle",
      kind: "CODE" as const,
      titleAz: "Az\u0259rbaycan Respublikas\u0131n\u0131n M\u00fclki M\u0259c\u0259ll\u0259si",
      titleRu: "Гражданский кодекс Азербайджанской Республики",
      titleEn: "Civil Code of the Republic of Azerbaijan",
      cat: "M\u0259c\u0259ll\u0259l\u0259r",
      url: "https://e-qanun.az/",
      body: "## Haqq\u0131nda\n\nM\u00fclki M\u0259c\u0259ll\u0259 m\u00fclki h\u00fcquq m\u00fcnasib\u0259tl\u0259rini — \u0259mlak, m\u00fcqavil\u0259l\u0259r, \u00f6hd\u0259likl\u0259r, miras v\u0259 dig\u0259r m\u0259s\u0259l\u0259l\u0259ri t\u0259nzim edir.\n\n**Tam r\u0259smi m\u0259tn:** [e-qanun.az](https://e-qanun.az/)",
    },
    {
      slug: "vekillik-qanunu",
      kind: "LAW" as const,
      titleAz: "V\u0259kill\u0259r v\u0259 v\u0259killik f\u0259aliyy\u0259ti haqq\u0131nda Qanun",
      titleRu: "Закон об адвокатах и адвокатской деятельности",
      titleEn: "Law on Advocates and Advocacy",
      cat: "Qanunlar",
      url: "https://e-qanun.az/",
      body: "## Haqq\u0131nda\n\nBu Qanun v\u0259killiyin t\u0259\u015fkili, v\u0259kill\u0259rin h\u00fcquq v\u0259 v\u0259zif\u0259l\u0259ri, v\u0259kill\u0259r kollegiyas\u0131n\u0131n f\u0259aliyy\u0259t \u0259saslar\u0131n\u0131 m\u00fc\u0259yy\u0259n edir.\n\n**Tam r\u0259smi m\u0259tn:** [e-qanun.az](https://e-qanun.az/)",
    },
  ];
  for (let i = 0; i < LAW_DOCS.length; i++) {
    const L = LAW_DOCS[i];
    await prisma.lawDoc.create({
      data: {
        kind: L.kind,
        slug: L.slug,
        titleAz: L.titleAz,
        titleRu: L.titleRu,
        titleEn: L.titleEn,
bodyAz: L.body,
        sortOrder: i,
        publishedAt: new Date(),
      },
    });
  }
  console.log("laws: " + LAW_DOCS.length + " docs (Emek Mecellesi with real e-qanun text)");

  // ── 6. 20 clients ──
  const clientHash = bcrypt.hashSync("Valikim.az", 10); // literal per spec — note the l/k
  const usedMails = new Set(["javid@vakilim.az"]);
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
  console.log("Admin login:  javid@vakilim.az / Vakilim.az  → 2FA code to +16505500808 (echoed in dev)");
  const [nPosts, nLaws, nTpl, nLaw, nUsr] = await Promise.all([
    prisma.post.count(), prisma.lawDoc.count(), prisma.docTemplate.count(),
    prisma.lawyerProfile.count(), prisma.user.count(),
  ]);
  console.log("SEED SELF-REPORT — posts:" + nPosts + " laws:" + nLaws + " templates:" + nTpl + " lawyers:" + nLaw + " users:" + nUsr);
  console.log("Any client:   <listed email> / Valikim.az  · lawyers sign in via phone code");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

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

const RENTAL_FIELDS = [
  { key: "landlordName", labelAz: "İcarəyə verənin adı, soyadı", helpAz: "Şəxsiyyət vəsiqəsindəki kimi tam yazın.", type: "text", required: true },
  { key: "tenantName", labelAz: "İcarəçinin adı, soyadı", helpAz: "Mənzili kirayələyən şəxs.", type: "text", required: true },
  { key: "propertyAddress", labelAz: "Mənzilin ünvanı", helpAz: "Şəhər, küçə, bina və mənzil nömrəsi.", type: "text", required: true },
  { key: "rentAzn", labelAz: "Aylıq kirayə haqqı (₼)", helpAz: "Yalnız rəqəm yazın, məsələn: 600", type: "number", required: true },
  { key: "depositAzn", labelAz: "Depozit (₼)", helpAz: "Depozit yoxdursa 0 yazın.", type: "number", required: true },
  { key: "startDate", labelAz: "İcarənin başlanğıc tarixi", type: "date", required: true },
  { key: "termMonths", labelAz: "Müddət (ay)", helpAz: "Müqavilənin neçə ay qüvvədə olacağı.", type: "number", required: true },
  { key: "paymentDay", labelAz: "Ödəniş günü", helpAz: "Hər ayın hansı günü ödəniş edilir (1–28).", type: "number", required: true },
];

const RENTAL_BODY = `Bakı şəhəri — {{TODAY}}

Bir tərəfdən {{landlordName}} (bundan sonra "İcarəyə verən") və digər tərəfdən {{tenantName}} (bundan sonra "İcarəçi") aşağıdakı şərtlərlə bu müqaviləni bağladılar.

# 1. Müqavilənin predmeti
İcarəyə verən ona məxsus {{propertyAddress}} ünvanında yerləşən mənzili yaşayış məqsədilə İcarəçinin müvəqqəti istifadəsinə verir.

# 2. Müddət
Müqavilə {{startDate}} tarixindən qüvvəyə minir və {{termMonths}} ay müddətinə bağlanır. Tərəflərin yazılı razılığı ilə müddət uzadıla bilər.

# 3. İcarə haqqı və ödəniş qaydası
Aylıq icarə haqqı {{rentAzn}} manat təşkil edir və hər ayın {{paymentDay}}-ci günündən gec olmayaraq ödənilir. Kommunal xərclər, tərəflər başqa cür razılaşmayıblarsa, İcarəçi tərəfindən ödənilir.

# 4. Depozit
İcarəçi müqavilə imzalanarkən {{depositAzn}} manat məbləğində depozit ödəyir. Mənzil müqavilə şərtlərinə uyğun təhvil verildikdə depozit tam geri qaytarılır; mənzilə və ya əmlaka vurulmuş zərər depozitdən tutulur.

# 5. Tərəflərin öhdəlikləri
İcarəyə verən mənzili yaşayış üçün yararlı vəziyyətdə təhvil verir və İcarəçinin qanuni istifadəsinə mane olmur. İcarəçi mənzildən təyinatı üzrə istifadə edir, üçüncü şəxslərə vermir, İcarəyə verənin yazılı razılığı olmadan yenidənqurma aparmır.

# 6. Müqaviləyə xitam
Tərəflərdən hər biri digər tərəfi ən azı 30 gün əvvəl yazılı xəbərdar etməklə müqaviləyə vaxtından əvvəl xitam verə bilər. İcarə haqqının 15 gündən artıq gecikdirilməsi İcarəyə verənə müqaviləni birtərəfli ləğv etmək hüququ verir.

# 7. Digər şərtlər
Bu müqavilədən irəli gələn mübahisələr danışıqlar yolu ilə, razılıq əldə olunmadıqda Azərbaycan Respublikasının qanunvericiliyinə uyğun həll edilir. Müqavilə iki nüsxədə tərtib olunub, hər tərəfə bir nüsxə verilir.

# İmzalar
İcarəyə verən: {{landlordName}} ____________________

İcarəçi: {{tenantName}} ____________________

Sənəd №: {{DOC_UID}}`;

const COMPLAINT_FIELDS = [
  { key: "orgName", labelAz: "Müraciət olunan qurum", helpAz: "Şikayətin ünvanlandığı təşkilatın tam adı.", type: "text", required: true },
  { key: "applicantName", labelAz: "Adınız, soyadınız", type: "text", required: true },
  { key: "applicantAddress", labelAz: "Ünvanınız", type: "text", required: true },
  { key: "applicantPhone", labelAz: "Əlaqə nömrəniz", type: "text", required: true },
  { key: "subject", labelAz: "Şikayətin mövzusu", helpAz: "Bir cümlə ilə: nə barədə şikayət edirsiniz.", type: "text", required: true },
  { key: "details", labelAz: "Şikayətin təsviri", helpAz: "Nə vaxt, harada, nə baş verdi — tarixləri qeyd edin.", type: "textarea", required: true },
  { key: "request", labelAz: "Tələbiniz", helpAz: "Qurumdan konkret nə istəyirsiniz.", type: "textarea", required: true },
];

const COMPLAINT_BODY = `{{orgName}} rəhbərliyinə

{{applicantName}}
Ünvan: {{applicantAddress}}
Əlaqə: {{applicantPhone}}

# ŞİKAYƏT ƏRİZƏSİ

Mövzu: {{subject}}

Hörmətli rəhbərlik,

{{details}}

Yuxarıda göstərilənləri nəzərə alaraq xahiş edirəm:

{{request}}

"Vətəndaşların müraciətləri haqqında" Azərbaycan Respublikasının Qanununa əsasən müraciətimə qanunla müəyyən edilmiş müddətdə baxılmasını və yazılı cavab verilməsini xahiş edirəm.

Tarix: {{TODAY}}

İmza: ____________________ ({{applicantName}})

Sənəd №: {{DOC_UID}}`;

async function upsertTemplate(t: {
  slug: string;
  title: string;
  description: string;
  category: string;
  priceQepik: number;
  sortOrder: number;
  bodyText: string;
  fields: unknown[];
}) {
  const template = await prisma.docTemplate.upsert({
    where: { slug: t.slug },
    update: {
      title: t.title,
      description: t.description,
      category: t.category,
      priceQepik: t.priceQepik,
      sortOrder: t.sortOrder,
      locale: "az",
    },
    create: {
      slug: t.slug,
      title: t.title,
      description: t.description,
      category: t.category,
      priceQepik: t.priceQepik,
      sortOrder: t.sortOrder,
      locale: "az",
    },
  });
  await prisma.templateVersion.upsert({
    where: { templateId_version: { templateId: template.id, version: 1 } },
    update: { bodyText: t.bodyText, fields: t.fields as object },
    create: {
      templateId: template.id,
      version: 1,
      bodyText: t.bodyText,
      fields: t.fields as object,
    },
  });
}

async function main() {
  for (const [i, area] of AREAS.entries()) {
    await prisma.practiceArea.upsert({
      where: { slug: area.slug },
      update: { nameAz: area.nameAz, nameEn: area.nameEn, sortOrder: i },
      create: { ...area, sortOrder: i },
    });
  }
  console.log(`Seeded ${AREAS.length} practice areas`);

  await upsertTemplate({
    slug: "menzil-icare-muqavilesi",
    title: "Mənzil icarəsi müqaviləsi",
    description:
      "Fiziki şəxslər arasında yaşayış mənzilinin kirayəsi üçün standart müqavilə. Nümunə şablon — istifadədən əvvəl hüquqşünas yoxlaması tövsiyə olunur.",
    category: "Daşınmaz əmlak",
    priceQepik: 1500,
    sortOrder: 1,
    bodyText: RENTAL_BODY,
    fields: RENTAL_FIELDS,
  });

  await upsertTemplate({
    slug: "sikayet-erizesi",
    title: "Şikayət ərizəsi",
    description:
      "İstənilən dövlət qurumuna və ya təşkilata rəsmi şikayət üçün universal ərizə forması.",
    category: "Ərizələr",
    priceQepik: 0,
    sortOrder: 2,
    bodyText: COMPLAINT_BODY,
    fields: COMPLAINT_FIELDS,
  });

  console.log("Seeded 2 document templates");
}

main().finally(() => prisma.$disconnect());

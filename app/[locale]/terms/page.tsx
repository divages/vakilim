import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("termsTitle"),
    alternates: {
      canonical: `/${locale}/terms`,
      languages: { az: "/az/terms", ru: "/ru/terms", en: "/en/terms", "x-default": "/az/terms" },
    },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-[15px] leading-relaxed">
      <h1 className="text-2xl font-bold text-navy">{t("legal.termsTitle")}</h1>
      <p className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        {t("legal.draftBanner")}
      </p>
      {locale !== "az" && (
        <p className="mt-3 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-slate">
          {t("legal.officialNote")}
        </p>
      )}

      <h2 className="mt-8 text-lg font-semibold text-navy">1. Platforma haqqında</h2>
      <p className="mt-2">
        Vakilim.az müştərilərlə yoxlanılmış vəkillər və hüquqşünaslar arasında
        vasitəçilik edən onlayn platformadır. Platforma özü hüquqi xidmət
        göstərmir; hüquqi məsləhəti seçdiyiniz mütəxəssis verir və ona görə
        peşə məsuliyyəti daşıyır.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-navy">2. Hesab</h2>
      <p className="mt-2">
        Qeydiyyat telefon nömrəsi və birdəfəlik SMS kodu ilə aparılır.
        Hesabınızda baş verən əməliyyatlara görə məsuliyyət daşıyırsınız.
        Vəkil statusu yalnız lisenziya və şəxsiyyət sənədləri yoxlanıldıqdan
        sonra verilir.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-navy">3. Görüşlər və ödənişlər</h2>
      <p className="mt-2">
        Görüş sifariş edilərkən ödəniş platforma tərəfindən tutulur və xidmət
        göstərildikdən sonra vəkilə ötürülür. Vəkil sifarişi 12 saat ərzində
        təsdiqləmədikdə sifariş avtomatik ləğv edilir və məbləğ tam geri
        qaytarılır. Ləğv və geri qaytarma qaydaları ayrıca{" "}
        <a href="/refund-policy" className="text-emerald underline">
          Geri qaytarma siyasətində
        </a>{" "}
        göstərilib.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-navy">4. Görüş yazıları</h2>
      <p className="mt-2">
        Onlayn görüşlər keyfiyyətə nəzarət və mübahisələrin həlli məqsədilə
        hər iki tərəfin razılığı ilə qeydə alına bilər və 30 gün saxlanılır.
        Razılıq görüşə qoşulma zamanı alınır.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-navy">5. Sənəd xidməti</h2>
      <p className="mt-2">
        Platformada yaradılan sənədlər yalnız daxil etdiyiniz məlumatlarla
        bağlı konkret iş üçün lisenziyalaşdırılır. Sənədin başqa işlərdə
        çoxaldılması lisenziya şərtlərinə ziddir. Hər sənəd unikal yoxlama
        kodu daşıyır. Sənəd şablonları hüquqi məsləhəti əvəz etmir.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-navy">6. Davranış qaydaları</h2>
      <p className="mt-2">
        Platformadan kənar ödəniş təklifi, təhqir, saxta məlumat və qanunsuz
        məqsədlər üçün istifadə qadağandır və hesabın dayandırılması ilə
        nəticələnə bilər.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-navy">7. Mübahisələr</h2>
      <p className="mt-2">
        Görüşlə bağlı şikayət görüş bitdikdən sonra 72 saat ərzində açıla
        bilər; vəkilin cavab müddəti 2 gündür; yekun qərarı platforma verir
        və ödənişin tam və ya qismən qaytarılması mümkündür.
      </p>

      <p className="mt-8 text-sm text-slate">
        Əlaqə: info@vakilim.az (yerləşdirilməmiş). Bu şərtlər dəyişdirildikdə
        yenilənmə tarixi burada göstəriləcək.
      </p>
    </div>
  );
}

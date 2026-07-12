import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("privacyTitle"),
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: { az: "/az/privacy", ru: "/ru/privacy", en: "/en/privacy", "x-default": "/az/privacy" },
    },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 text-[15px] leading-relaxed">
      <h1 className="text-2xl font-bold text-navy">{t("legal.privacyTitle")}</h1>
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        {t("legal.draftBanner")}
      </p>
      {locale !== "az" && (
        <p className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-sm text-slate">
          {t("legal.officialNote")}
        </p>
      )}

      <h2 className="mt-8 text-lg font-semibold text-navy">Topladığımız məlumatlar</h2>
      <p className="mt-2">
        Telefon nömrəsi, ad, istəyə görə e-poçt; vəkillər üçün əlavə olaraq
        lisenziya və şəxsiyyət sənədləri (yalnız yoxlama üçün, ictimai
        görünmür). Görüş və sifariş tarixçəsi, yazışmalar, rəylər. Sənəd
        sifarişlərində daxil etdiyiniz cavablar bazada{" "}
        <b>şifrələnmiş şəkildə</b> saxlanılır. Görüş yazıları razılıq
        əsasında aparılır və 30 gün sonra silinir.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-navy">İstifadə məqsədləri</h2>
      <p className="mt-2">
        Xidmətin göstərilməsi (görüşlərin təşkili, ödənişlər, sənəd
        yaradılması), təhlükəsizlik və mübahisələrin həlli, bildirişlər
        (görüş xatırlatmaları və status dəyişiklikləri), anonim statistik
        təhlil.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-navy">Üçüncü tərəflər</h2>
      <p className="mt-2">
        Hazırkı demo mühitində infrastruktur xidmətləri: Vercel (hostinq),
        Neon (verilənlər bazası), Cloudflare R2 (fayl anbarı), LiveKit
        (video), Google Analytics (statistika). İstehsal mühiti Azərbaycan
        ərazisindəki serverlərə köçürüləcək. Məlumatlarınız reklam məqsədilə
        satılmır.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-navy">Hüquqlarınız</h2>
      <p className="mt-2">
        Məlumatlarınıza baxmaq, düzəltmək və hesabınızın silinməsini tələb
        etmək hüququnuz var. Müraciət üçün: info@vakilim.az
        (yerləşdirilməmiş).
      </p>
    </div>
  );
}

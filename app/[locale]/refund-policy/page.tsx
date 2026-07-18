import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("refundTitle"),
    alternates: {
      canonical: `/${locale}/refund-policy`,
      languages: { az: "/az/refund-policy", ru: "/ru/refund-policy", en: "/en/refund-policy", "x-default": "/az/refund-policy" },
    },
  };
}

export default async function RefundPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 text-[15px] leading-relaxed">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">
        {t("legal.refundTitle")}
      </h1>
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        {t("legal.draftBanner")}
      </p>
      {locale !== "az" && (
        <p className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-sm text-slate">
          {t("legal.officialNote")}
        </p>
      )}

      <h2 className="mt-8 text-lg font-semibold text-navy">
        Müştəri tərəfindən ləğv
      </h2>
      <p className="mt-2">
        Görüşə <b>12 saatdan çox</b> qalmış ləğvdə məbləğin <b>100%-i</b>,{" "}
        <b>2–12 saat</b> qalmış ləğvdə <b>50%-i</b> geri qaytarılır. Görüşə{" "}
        <b>2 saatdan az</b> qalmış ləğvdə və gəlməmə halında məbləğ geri
        qaytarılmır. Görüş vaxtını görüşə ən azı 24 saat qalmış <b>1 dəfə</b>{" "}
        pulsuz dəyişmək mümkündür.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-navy">
        Vəkil tərəfindən imtina və gəlməmə
      </h2>
      <p className="mt-2">
        Vəkil sifarişdən imtina etdikdə və ya görüşə gəlmədikdə məbləğ{" "}
        <b>avtomatik tam geri qaytarılır</b>. Vəkil sifarişi 12 saat ərzində
        cavablandırmadıqda sifariş ləğv edilir və məbləğ tam qaytarılır.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-navy">
        Texniki nasazlıq
      </h2>
      <p className="mt-2">
        Platformanın texniki nasazlığı səbəbindən baş tutmayan görüşlər üçün
        məbləğ tam geri qaytarılır və ya görüş pulsuz yenidən planlaşdırılır.
        Şikayət görüşdən sonra 72 saat ərzində açılmalıdır.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-navy">Sənəd sifarişləri</h2>
      <p className="mt-2">
        Sənəd fərdi məlumatlar əsasında dərhal yaradıldığı üçün ödənişdən və
        sənədin təqdimindən sonra geri qaytarılmır. Texniki qüsur (sənədin
        yaranmaması, oxunmaz fayl) halında məbləğ tam qaytarılır.
      </p>

      <p className="mt-8 text-sm text-slate">
        Geri qaytarmalar ödənişin edildiyi üsulla, adətən 1–5 iş günü ərzində
        icra olunur.
      </p>
    </div>
  );
}

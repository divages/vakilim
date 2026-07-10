"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function TemplateForm() {
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    FORBIDDEN: t("admT.errors.FORBIDDEN"),
    INVALID_BODY: t("admT.errors.INVALID_BODY"),
    FIELDS_JSON: t("admT.errors.FIELDS_JSON"),
    FIELDS_INVALID: t("admT.errors.FIELDS_INVALID"),
    FIELDS_DUPLICATE: t("admT.errors.FIELDS_DUPLICATE"),
    DEFAULT: t("admT.errors.DEFAULT"),
  };
  const [slug, setSlug] = useState("");
  const [title, setTitleAz] = useState("");
  const [description, setDescriptionAz] = useState("");
  const [category, setCategory] = useState("");
  const [priceAzn, setPriceAzn] = useState("0");
  const [locale, setLocale] = useState("az");
  const [familyKey, setFamilyKey] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [fieldsJson, setFieldsJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          description,
          category,
          priceAzn: Number(priceAzn),
          locale,
          familyKey,
          bodyText,
          fieldsJson,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "PLACEHOLDER_UNKNOWN") {
          setError(
            t("admT.unknown", { list: data.unknown.join(", ") })
          );
        } else {
          setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        }
        return;
      }
      if (data.unused?.length) {
        window.alert(
          t("admT.unused", { list: data.unused.join(", ") })
        );
      }
      window.location.reload();
    } catch {
      setError(ERRORS.DEFAULT);
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy";
  const label = "block text-xs font-medium text-navy";

  return (
    <form
      className="mt-3 space-y-4 rounded-2xl border border-gray-100 shadow-sm p-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>{t("admT.slug")}</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="etirazname" className={input} />
        </div>
        <div>
          <label className={label}>{t("admT.name")}</label>
          <input value={title} onChange={(e) => setTitleAz(e.target.value)} className={input} />
        </div>
        <div>
          <label className={label}>{t("admT.cat")}</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t("admT.catPh")} className={input} />
        </div>
        <div>
          <label className={label}>{t("admT.lang")}</label>
          <select value={locale} onChange={(e) => setLocale(e.target.value)} className={input}>
            <option value="az">{t("common.langName.az")}</option>
            <option value="ru">{t("common.langName.ru")}</option>
            <option value="en">{t("common.langName.en")}</option>
          </select>
        </div>
        <div>
          <label className={label}>{t("admT.family")}</label>
          <input value={familyKey} onChange={(e) => setFamilyKey(e.target.value)} placeholder="service-contract" className={input} />
        </div>
        <div>
          <label className={label}>{t("admT.price")}</label>
          <input value={priceAzn} onChange={(e) => setPriceAzn(e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" className={input} />
        </div>
      </div>
      <div>
        <label className={label}>{t("admT.desc")}</label>
        <textarea value={description} onChange={(e) => setDescriptionAz(e.target.value)} rows={2} className={input} />
      </div>
      <div>
        <label className={label}>{t("admT.body")} ({"{{sahə}}"} {t("admT.bodySuffix")})</label>
        <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={10} className={`${input} font-mono text-xs`} />
      </div>
      <div>
        <label className={label}>{t("admT.fields")}</label>
        <textarea value={fieldsJson} onChange={(e) => setFieldsJson(e.target.value)} rows={8} className={`${input} font-mono text-xs`} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="rounded-xl bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark disabled:opacity-50">
        {busy ? "…" : t("chat.send")}
      </button>
    </form>
  );
}

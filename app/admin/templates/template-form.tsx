"use client";

import { useState } from "react";

const ERRORS: Record<string, string> = {
  FORBIDDEN: "İcazə yoxdur.",
  INVALID_BODY: "Meta sahələri düzgün doldurun (slug: kiçik hərf və defis).",
  FIELDS_JSON: "Sahələr JSON kimi oxuna bilmədi — sintaksisi yoxlayın.",
  FIELDS_INVALID: "Sahə tərifi düzgün deyil — bələdçiyə baxın.",
  FIELDS_DUPLICATE: "Sahə açarları təkrarlanır.",
  DEFAULT: "Xəta baş verdi.",
};

export default function TemplateForm() {
  const [slug, setSlug] = useState("");
  const [titleAz, setTitleAz] = useState("");
  const [descriptionAz, setDescriptionAz] = useState("");
  const [category, setCategory] = useState("");
  const [priceAzn, setPriceAzn] = useState("0");
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
          titleAz,
          descriptionAz,
          category,
          priceAzn: Number(priceAzn),
          bodyText,
          fieldsJson,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "PLACEHOLDER_UNKNOWN") {
          setError(
            `Mətndə qarşılığı olmayan sahələr: ${data.unknown
              .map((u: string) => `{{${u}}}`)
              .join(", ")}`
          );
        } else {
          setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        }
        return;
      }
      if (data.unused?.length) {
        window.alert(
          `Diqqət: bu sahələr mətndə istifadə olunmayıb: ${data.unused.join(", ")}`
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
      className="mt-3 space-y-4 rounded border border-gray-200 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>Slug (dəyişməz identifikator)</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="etirazname" className={input} />
        </div>
        <div>
          <label className={label}>Başlıq</label>
          <input value={titleAz} onChange={(e) => setTitleAz(e.target.value)} className={input} />
        </div>
        <div>
          <label className={label}>Kateqoriya</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ərizələr" className={input} />
        </div>
        <div>
          <label className={label}>Qiymət (₼, 0 = pulsuz)</label>
          <input value={priceAzn} onChange={(e) => setPriceAzn(e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" className={input} />
        </div>
      </div>
      <div>
        <label className={label}>Təsvir</label>
        <textarea value={descriptionAz} onChange={(e) => setDescriptionAz(e.target.value)} rows={2} className={input} />
      </div>
      <div>
        <label className={label}>Sənəd mətni ({"{{sahə}}"} yerdəyişənləri ilə)</label>
        <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={10} className={`${input} font-mono text-xs`} />
      </div>
      <div>
        <label className={label}>Sahələr (JSON — bələdçidəki format)</label>
        <textarea value={fieldsJson} onChange={(e) => setFieldsJson(e.target.value)} rows={8} className={`${input} font-mono text-xs`} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark disabled:opacity-50">
        {busy ? "…" : "Göndər"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Area = { id: string; nameAz: string };

const LANGS = ["az", "ru", "en"] as const;

export default function ApplyForm({
  areas,
  defaultFullName,
}: {
  areas: Area[];
  defaultFullName: string;
}) {
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    UNAUTHORIZED: t("apply.errors.UNAUTHORIZED"),
    ALREADY_APPLIED: t("apply.errors.ALREADY_APPLIED"),
    INVALID_AREAS: t("apply.errors.INVALID_AREAS"),
    INVALID_BODY: t("apply.errors.INVALID_BODY"),
    FILE_REQUIRED: t("apply.errors.FILE_REQUIRED"),
    FILE_TOO_LARGE: t("apply.errors.FILE_TOO_LARGE"),
    FILE_TYPE: t("apply.errors.FILE_TYPE"),
    SERVER_CONFIG: t("apply.errors.SERVER_CONFIG"),
    DEFAULT: t("apply.errors.DEFAULT"),
  };
  const [fullName, setFullName] = useState(defaultFullName);
  const [type, setType] = useState<"ADVOCATE" | "LICENSED_LAWYER">("ADVOCATE");
  const [licenseNo, setLicenseNo] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [city, setCity] = useState("Bakı");
  const [bios, setBios] = useState({ az: "", ru: "", en: "" });
  const [languages, setLanguages] = useState<string[]>(["az"]);
  const [areaIds, setAreaIds] = useState<string[]>([]);
  const [licenseDoc, setLicenseDoc] = useState<File | null>(null);
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggle(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  function localCheck(): string | null {
    if (fullName.trim().length < 3) return t("apply.eFullName");
    if (licenseNo.trim().length < 2) return t("apply.eLicense");
    if (yearsExperience === "" || Number(yearsExperience) < 0)
      return t("apply.eYears");
    for (const l of languages as ("az" | "ru" | "en")[]) {
      if (bios[l].trim().length < 20)
        return t("apply.eBio", { lang: l.toUpperCase() });
    }
    if (languages.length === 0) return t("apply.eLangs");
    if (areaIds.length === 0) return t("apply.eAreas");
    if (areaIds.length > 5) return t("apply.eAreasMax");
    if (!licenseDoc) return t("apply.eLicDoc");
    if (!idDoc) return t("apply.eIdDoc");
    return null;
  }

  async function submit() {
    const local = localCheck();
    if (local) {
      setError(local);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("fullName", fullName);
      fd.set("type", type);
      fd.set("licenseNo", licenseNo);
      fd.set("yearsExperience", yearsExperience);
      fd.set("city", city);
      fd.set("bioAz", bios.az);
      fd.set("bioRu", bios.ru);
      fd.set("bioEn", bios.en);
      for (const l of languages) fd.append("languages", l);
      for (const a of areaIds) fd.append("practiceAreaIds", a);
      if (licenseDoc) fd.set("licenseDoc", licenseDoc);
      if (idDoc) fd.set("idDoc", idDoc);
      const res = await fetch("/api/lawyer/apply", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        return;
      }
      window.location.href = "/lawyer/dashboard";
    } catch {
      setError(ERRORS.DEFAULT);
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-navy";
  const labelCls = "block text-sm font-medium text-navy";

  return (
    <form
      className="mt-8 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div>
        <label htmlFor="fullName" className={labelCls}>
          {t("apply.fullName")}
        </label>
        <input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={`mt-1 ${inputCls}`}
          autoFocus
        />
      </div>

      <div>
        <span className={labelCls}>Status</span>
        <div className="mt-2 space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              checked={type === "ADVOCATE"}
              onChange={() => setType("ADVOCATE")}
            />
            {t("common.lawyerTypeFull.ADVOCATE")}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              checked={type === "LICENSED_LAWYER"}
              onChange={() => setType("LICENSED_LAWYER")}
            />
            {t("common.lawyerTypeFull.LICENSED_LAWYER")}
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="licenseNo" className={labelCls}>
            {t("apply.licenseNo")}
          </label>
          <input
            id="licenseNo"
            value={licenseNo}
            onChange={(e) => setLicenseNo(e.target.value)}
            className={`mt-1 ${inputCls}`}
          />
        </div>
        <div>
          <label htmlFor="years" className={labelCls}>
            {t("apply.years")}
          </label>
          <input
            id="years"
            value={yearsExperience}
            onChange={(e) =>
              setYearsExperience(e.target.value.replace(/\D/g, "").slice(0, 2))
            }
            inputMode="numeric"
            className={`mt-1 ${inputCls}`}
          />
        </div>
        <div>
          <label htmlFor="city" className={labelCls}>
            {t("apply.city")}
          </label>
          <input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={`mt-1 ${inputCls}`}
          />
        </div>
      </div>

      <div>
        <span className={labelCls}>{t("apply.biosTitle")}</span>
        <p className="mt-1 text-xs text-slate">
          {t("apply.biosHelp")}
        </p>
        {(["az", "ru", "en"] as const)
          .filter((l) => languages.includes(l))
          .map((l) => (
            <textarea
              key={l}
              value={bios[l]}
              onChange={(e) => setBios({ ...bios, [l]: e.target.value })}
              rows={3}
              placeholder={
                l === "az"
                  ? "Azərbaycanca təqdimat…"
                  : l === "ru"
                    ? "Представление на русском…"
                    : "Introduction in English…"
              }
              className={`mt-1 ${inputCls}`}
            />
          ))}
      </div>

      <div>
        <span className={labelCls}>{t("apply.langs")}</span>
        <div className="mt-2 flex gap-6 text-sm">
          {LANGS.map((l) => (
            <label key={l} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={languages.includes(l)}
                onChange={() => toggle(languages, l, setLanguages)}
              />
              {t(`common.langName.${l}`)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className={labelCls}>{t("apply.areas")}</span>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {areas.map((a) => (
            <label key={a.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={areaIds.includes(a.id)}
                onChange={() => toggle(areaIds, a.id, setAreaIds)}
              />
              {a.nameAz}
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className={labelCls}>{t("apply.docs")}</span>
        <p className="mt-1 text-xs text-slate">
          {t("apply.docsNote")}
        </p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="cursor-pointer rounded border border-dashed border-gray-300 p-3 text-sm hover:border-navy">
            <span className="font-medium text-navy">
              📎 {t("apply.licDoc")}
            </span>
            <span className="mt-1 block truncate text-xs text-slate">
              {licenseDoc ? licenseDoc.name : "PDF / JPG / PNG"}
            </span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setLicenseDoc(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="cursor-pointer rounded border border-dashed border-gray-300 p-3 text-sm hover:border-navy">
            <span className="font-medium text-navy">
              📎 {t("apply.idDoc")}
            </span>
            <span className="mt-1 block truncate text-xs text-slate">
              {idDoc ? idDoc.name : "PDF / JPG / PNG"}
            </span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setIdDoc(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        disabled={busy}
        className="w-full rounded bg-navy py-2.5 font-medium text-white hover:bg-navy-dark disabled:opacity-50"
      >
        {busy ? t("common.sending") : t("apply.submit")}
      </button>
    </form>
  );
}

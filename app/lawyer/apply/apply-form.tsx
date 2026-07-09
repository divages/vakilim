"use client";

import { useState } from "react";

type Area = { id: string; nameAz: string };

const ERRORS: Record<string, string> = {
  UNAUTHORIZED: "Sessiya bitib. Zəhmət olmasa yenidən daxil olun.",
  ALREADY_APPLIED: "Siz artıq müraciət etmisiniz.",
  INVALID_AREAS: "Seçilmiş fəaliyyət sahələri düzgün deyil.",
  INVALID_BODY: "Bütün sahələri düzgün doldurun.",
  DEFAULT: "Xəta baş verdi. Bir az sonra yenidən cəhd edin.",
};

const LANGS = [
  { code: "az", label: "Azərbaycan" },
  { code: "ru", label: "Rus" },
  { code: "en", label: "İngilis" },
];

export default function ApplyForm({
  areas,
  defaultFullName,
}: {
  areas: Area[];
  defaultFullName: string;
}) {
  const [fullName, setFullName] = useState(defaultFullName);
  const [type, setType] = useState<"ADVOCATE" | "LICENSED_LAWYER">("ADVOCATE");
  const [licenseNo, setLicenseNo] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [city, setCity] = useState("Bakı");
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState<string[]>(["az"]);
  const [areaIds, setAreaIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggle(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  function localCheck(): string | null {
    if (fullName.trim().length < 3) return "Ad və soyadınızı tam yazın.";
    if (licenseNo.trim().length < 2) return "Lisenziya / vəsiqə nömrəsini yazın.";
    if (yearsExperience === "" || Number(yearsExperience) < 0)
      return "Təcrübə ilini qeyd edin (0 ola bilər).";
    if (bio.trim().length < 20) return "Haqqınızda ən azı 20 simvol yazın.";
    if (languages.length === 0) return "Ən azı bir dil seçin.";
    if (areaIds.length === 0) return "Ən azı bir fəaliyyət sahəsi seçin.";
    if (areaIds.length > 5) return "Ən çoxu 5 fəaliyyət sahəsi seçilə bilər.";
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
      const res = await fetch("/api/lawyer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          type,
          licenseNo,
          yearsExperience: Number(yearsExperience),
          city,
          bio,
          languages,
          practiceAreaIds: areaIds,
        }),
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
          Ad və soyad
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
            Vəkil (Vəkillər Kollegiyasının üzvü)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              checked={type === "LICENSED_LAWYER"}
              onChange={() => setType("LICENSED_LAWYER")}
            />
            Hüquqşünas
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="licenseNo" className={labelCls}>
            Lisenziya / vəsiqə №
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
            Təcrübə (il)
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
            Şəhər
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
        <label htmlFor="bio" className={labelCls}>
          Haqqınızda
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="İxtisaslaşdığınız sahələr, təcrübəniz və yanaşmanız barədə qısa məlumat…"
          className={`mt-1 ${inputCls}`}
        />
      </div>

      <div>
        <span className={labelCls}>Dillər</span>
        <div className="mt-2 flex gap-6 text-sm">
          {LANGS.map((l) => (
            <label key={l.code} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={languages.includes(l.code)}
                onChange={() => toggle(languages, l.code, setLanguages)}
              />
              {l.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className={labelCls}>Fəaliyyət sahələri (1–5)</span>
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        disabled={busy}
        className="w-full rounded bg-navy py-2.5 font-medium text-white hover:bg-navy-dark disabled:opacity-50"
      >
        {busy ? "Göndərilir…" : "Müraciət et"}
      </button>
    </form>
  );
}

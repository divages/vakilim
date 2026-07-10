"use client";

import { useState } from "react";
import { formatAzn } from "@/lib/money";

type Service = {
  id: string;
  type: "VIDEO" | "AUDIO" | "WRITTEN" | "DOC_REVIEW";
  durationMin: number | null;
  priceQepik: number;
  active: boolean;
};

const TYPE_LABELS: Record<Service["type"], string> = {
  VIDEO: "Video görüş",
  AUDIO: "Səsli zəng",
  WRITTEN: "Yazılı cavab",
  DOC_REVIEW: "Sənəd yoxlanışı",
};

const CALL_TYPES: Service["type"][] = ["VIDEO", "AUDIO"];
const DURATIONS = [15, 30, 60];

const ERRORS: Record<string, string> = {
  UNAUTHORIZED: "Sessiya bitib. Yenidən daxil olun.",
  NO_PROFILE: "Əvvəlcə vəkil müraciəti göndərin.",
  INVALID_BODY: "Sahələri düzgün doldurun.",
  INVALID_DURATION: "Görüş növü üçün müddət seçin.",
  TOO_MANY_SERVICES: "Xidmət sayı limitə çatıb.",
  NOT_FOUND: "Xidmət tapılmadı. Səhifəni yeniləyin.",
  DEFAULT: "Xəta baş verdi. Bir az sonra yenidən cəhd edin.",
};

export default function ServicesManager({ services }: { services: Service[] }) {
  const [type, setType] = useState<Service["type"]>("VIDEO");
  const [durationMin, setDurationMin] = useState("30");
  const [priceAzn, setPriceAzn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isCall = CALL_TYPES.includes(type);

  async function call(url: string, init: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        return false;
      }
      return true;
    } catch {
      setError(ERRORS.DEFAULT);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    if (priceAzn === "" || Number(priceAzn) < 1) {
      setError("Qiyməti manatla yazın (ən azı 1).");
      return;
    }
    const ok = await call("/api/lawyer/services", {
      method: "POST",
      body: JSON.stringify({
        type,
        priceAzn: Number(priceAzn),
        ...(isCall ? { durationMin: Number(durationMin) } : {}),
      }),
    });
    if (ok) window.location.reload();
  }

  async function toggle(s: Service) {
    const ok = await call(`/api/lawyer/services/${s.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !s.active }),
    });
    if (ok) window.location.reload();
  }

  async function remove(s: Service) {
    if (!window.confirm("Bu xidmət silinsin?")) return;
    const ok = await call(`/api/lawyer/services/${s.id}`, { method: "DELETE" });
    if (ok) window.location.reload();
  }

  return (
    <div className="mt-8">
      <form
        className="rounded border border-gray-200 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <p className="text-sm font-medium text-navy">Yeni xidmət</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="stype" className="block text-xs text-slate">
              Növ
            </label>
            <select
              id="stype"
              value={type}
              onChange={(e) => setType(e.target.value as Service["type"])}
              className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm outline-none focus:border-navy"
            >
              {(Object.keys(TYPE_LABELS) as Service["type"][]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sdur" className="block text-xs text-slate">
              Müddət
            </label>
            <select
              id="sdur"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              disabled={!isCall}
              className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm outline-none focus:border-navy disabled:bg-gray-100 disabled:text-gray-400"
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} dəq
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sprice" className="block text-xs text-slate">
              Qiymət (₼)
            </label>
            <input
              id="sprice"
              value={priceAzn}
              onChange={(e) =>
                setPriceAzn(e.target.value.replace(/\D/g, "").slice(0, 5))
              }
              inputMode="numeric"
              placeholder="50"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
            />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          disabled={busy}
          className="mt-4 rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark disabled:opacity-50"
        >
          {busy ? "…" : "Əlavə et"}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {services.length === 0 && (
          <p className="rounded border border-gray-200 bg-gray-50 p-4 text-sm">
            Hələ xidmət əlavə etməmisiniz.
          </p>
        )}
        {services.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-3 rounded border border-gray-200 p-3"
          >
            <div>
              <p className="text-sm font-medium text-navy">
                {TYPE_LABELS[s.type]}
                {s.durationMin ? ` · ${s.durationMin} dəq` : ""}
              </p>
              <p className="text-sm">{formatAzn(s.priceQepik)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded px-2 py-1 text-xs font-medium ${
                  s.active
                    ? "bg-emerald/15 text-navy"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {s.active ? "Aktiv" : "Deaktiv"}
              </span>
              <button
                onClick={() => toggle(s)}
                disabled={busy}
                className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:border-navy disabled:opacity-50"
              >
                {s.active ? "Deaktiv et" : "Aktiv et"}
              </button>
              <button
                onClick={() => remove(s)}
                disabled={busy}
                className="rounded border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

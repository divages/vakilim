"use client";

import { useState } from "react";

const ERRORS: Record<string, string> = {
  UNAUTHORIZED: "Sessiya bitib. Yenidən daxil olun.",
  EMAIL_TAKEN: "Bu e-poçt başqa hesabda istifadə olunur.",
  INVALID_BODY: "Ad ən azı 3 simvol, e-poçt düzgün formatda olmalıdır.",
  DEFAULT: "Xəta baş verdi. Bir az sonra yenidən cəhd edin.",
};

export default function SettingsForm({
  defaultFullName,
  defaultEmail,
  phone,
}: {
  defaultFullName: string;
  defaultEmail: string;
  phone: string;
}) {
  const [fullName, setFullName] = useState(defaultFullName);
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        return;
      }
      setSaved(true);
    } catch {
      setError(ERRORS.DEFAULT);
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy";

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div>
        <label className="block text-sm font-medium text-navy">Telefon</label>
        <input value={phone} disabled className={`${inputCls} bg-gray-50 text-gray-400`} />
      </div>
      <div>
        <label htmlFor="fn" className="block text-sm font-medium text-navy">
          Ad və soyad
        </label>
        <input
          id="fn"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="em" className="block text-sm font-medium text-navy">
          E-poçt (istəyə görə)
        </label>
        <input
          id="em"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ad@nümunə.az"
          inputMode="email"
          className={inputCls}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald">Yadda saxlanıldı ✓</p>}
      <button
        disabled={busy}
        className="w-full rounded bg-navy py-2.5 font-medium text-white hover:bg-navy-dark disabled:opacity-50"
      >
        {busy ? "…" : "Yadda saxla"}
      </button>
    </form>
  );
}

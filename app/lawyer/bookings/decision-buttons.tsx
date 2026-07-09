"use client";

import { useState } from "react";

const ERRORS: Record<string, string> = {
  UNAUTHORIZED: "Sessiya bitib. Yenidən daxil olun.",
  NO_PROFILE: "Vəkil profili tapılmadı.",
  NOT_FOUND: "Sifariş tapılmadı. Səhifəni yeniləyin.",
  INVALID_STATE: "Bu sifarişin statusu artıq dəyişib. Səhifəni yeniləyin.",
  DEFAULT: "Xəta baş verdi. Bir az sonra yenidən cəhd edin.",
};

export default function DecisionButtons({ bookingId }: { bookingId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(action: "ACCEPT" | "DECLINE") {
    if (
      action === "DECLINE" &&
      !window.confirm(
        "İmtina edilsin? Müştəriyə ödənişin tam məbləği geri qaytarılacaq."
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/lawyer/bookings/${bookingId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        return;
      }
      window.location.reload();
    } catch {
      setError(ERRORS.DEFAULT);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={() => decide("ACCEPT")}
          disabled={busy}
          className="rounded bg-emerald px-4 py-2 text-sm font-medium text-navy-dark hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "…" : "Qəbul et"}
        </button>
        <button
          onClick={() => decide("DECLINE")}
          disabled={busy}
          className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          İmtina et
        </button>
      </div>
      <p className="mt-2 text-xs text-slate">
        İmtina zamanı məbləğ avtomatik geri qaytarılır.
      </p>
    </div>
  );
}

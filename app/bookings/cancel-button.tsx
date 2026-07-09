"use client";

import { useState } from "react";

const ERRORS: Record<string, string> = {
  UNAUTHORIZED: "Sessiya bitib. Yenidən daxil olun.",
  NOT_FOUND: "Sifariş tapılmadı.",
  INVALID_STATE: "Bu sifarişin statusu artıq dəyişib. Səhifəni yeniləyin.",
  TOO_LATE: "Görüş artıq başlayıb — ləğv etmək mümkün deyil.",
  DEFAULT: "Xəta baş verdi. Bir az sonra yenidən cəhd edin.",
};

export default function CancelButton({
  bookingId,
  refundLabel,
}: {
  bookingId: string;
  refundLabel: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    if (
      !window.confirm(
        `Görüş ləğv edilsin? Geri qaytarılacaq məbləğ: ${refundLabel}`
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
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
    <>
      <button
        onClick={cancel}
        disabled={busy}
        className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {busy ? "…" : `Ləğv et · ${refundLabel}`}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </>
  );
}

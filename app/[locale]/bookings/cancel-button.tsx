"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function CancelButton({
  bookingId,
  refundLabel,
}: {
  bookingId: string;
  refundLabel: string;
}) {
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    UNAUTHORIZED: t("cancel.errors.UNAUTHORIZED"),
    NOT_FOUND: t("cancel.errors.NOT_FOUND"),
    INVALID_STATE: t("cancel.errors.INVALID_STATE"),
    TOO_LATE: t("cancel.errors.TOO_LATE"),
    DEFAULT: t("cancel.errors.DEFAULT"),
  };
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    if (
      !window.confirm(
        t("cancel.confirm", { refund: refundLabel })
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
        className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {busy ? "…" : t("cancel.btn", { refund: refundLabel })}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </>
  );
}

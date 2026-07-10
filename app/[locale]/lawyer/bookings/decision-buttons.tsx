"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function DecisionButtons({ bookingId }: { bookingId: string }) {
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    UNAUTHORIZED: t("lawB.errors.UNAUTHORIZED"),
    NO_PROFILE: t("lawB.errors.NO_PROFILE"),
    NOT_FOUND: t("lawB.errors.NOT_FOUND"),
    INVALID_STATE: t("lawB.errors.INVALID_STATE"),
    DEFAULT: t("lawB.errors.DEFAULT"),
  };
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(action: "ACCEPT" | "DECLINE") {
    if (
      action === "DECLINE" &&
      !window.confirm(
        t("lawB.confirmDecline")
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
          {busy ? "…" : t("lawB.accept")}
        </button>
        <button
          onClick={() => decide("DECLINE")}
          disabled={busy}
          className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {t("lawB.decline")}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate">
        {t("lawB.declineNote")}
      </p>
    </div>
  );
}

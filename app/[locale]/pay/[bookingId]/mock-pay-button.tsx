"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function MockPayButton({ bookingId }: { bookingId: string }) {
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    UNAUTHORIZED: t("pay.errors.UNAUTHORIZED"),
    NOT_FOUND: t("pay.errors.NOT_FOUND"),
    ALREADY_PAID: t("pay.errors.ALREADY_PAID"),
    DEFAULT: t("pay.errors.DEFAULT"),
  };
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        return;
      }
      window.location.href = "/bookings";
    } catch {
      setError(ERRORS.DEFAULT);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button
        onClick={pay}
        disabled={busy}
        className="mt-4 w-full rounded bg-navy py-3 font-medium text-white hover:bg-navy-dark disabled:opacity-50"
      >
        {busy ? t("pay.paying") : t("common.payTest")}
      </button>
    </>
  );
}

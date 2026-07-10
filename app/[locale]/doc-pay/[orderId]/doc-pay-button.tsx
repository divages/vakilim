"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function DocPayButton({ orderId }: { orderId: string }) {
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    UNAUTHORIZED: t("docPay.errors.UNAUTHORIZED"),
    NOT_FOUND: t("docPay.errors.NOT_FOUND"),
    ALREADY_PAID: t("docPay.errors.ALREADY_PAID"),
    DEFAULT: t("docPay.errors.DEFAULT"),
  };
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/doc-orders/${orderId}/pay`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        return;
      }
      window.location.href = "/documents";
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
        {busy ? t("docPay.generating") : t("common.payTest")}
      </button>
    </>
  );
}

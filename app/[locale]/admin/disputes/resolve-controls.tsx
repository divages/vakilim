"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ResolveControls({
  disputeId,
  remainingQepik,
}: {
  disputeId: string;
  remainingQepik: number;
}) {
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    FORBIDDEN: t("admD.errors.FORBIDDEN"),
    INVALID_STATE: t("admD.errors.INVALID_STATE"),
    NOTHING_TO_REFUND: t("admD.errors.NOTHING_TO_REFUND"),
    INVALID_AMOUNT: t("admD.errors.INVALID_AMOUNT"),
    NOT_FOUND: t("admD.errors.NOT_FOUND"),
    DEFAULT: t("admD.errors.DEFAULT"),
  };
  const [partialAzn, setPartialAzn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function resolve(
    resolution: "FULL_REFUND" | "PARTIAL_REFUND" | "DISMISSED"
  ) {
    const label =
      resolution === "FULL_REFUND"
        ? t("admD.fullL")
        : resolution === "PARTIAL_REFUND"
          ? t("admD.partialL", { amount: partialAzn })
          : t("admD.dismissL");
    if (!window.confirm(t("admD.confirm", { label }))) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution,
          ...(resolution === "PARTIAL_REFUND"
            ? { refundQepik: Math.round(Number(partialAzn) * 100) }
            : {}),
        }),
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
    <div className="mt-3 border-t border-gray-100 pt-3">
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => resolve("FULL_REFUND")}
          disabled={busy || remainingQepik <= 0}
          className="rounded bg-emerald px-3 py-2 text-sm font-medium text-navy-dark hover:opacity-90 disabled:opacity-40"
        >
          {t("admD.full")}
        </button>
        <div className="flex items-center gap-1">
          <input
            value={partialAzn}
            onChange={(e) =>
              setPartialAzn(e.target.value.replace(/[^\d.]/g, "").slice(0, 6))
            }
            placeholder="₼"
            inputMode="decimal"
            className="w-20 rounded border border-gray-300 px-2 py-2 text-sm outline-none focus:border-navy"
          />
          <button
            onClick={() => resolve("PARTIAL_REFUND")}
            disabled={busy || !partialAzn || remainingQepik <= 0}
            className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-navy hover:border-navy disabled:opacity-40"
          >
            {t("admD.partial")}
          </button>
        </div>
        <button
          onClick={() => resolve("DISMISSED")}
          disabled={busy}
          className="rounded border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
        >
          {t("admD.dismiss")}
        </button>
      </div>
    </div>
  );
}

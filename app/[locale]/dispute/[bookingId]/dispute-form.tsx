"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const REASONS = ["no_show", "technical", "quality", "other"] as const;

export default function DisputeForm({ bookingId }: { bookingId: string }) {
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    UNAUTHORIZED: t("dispute.errors.UNAUTHORIZED"),
    ALREADY_OPEN: t("dispute.errors.ALREADY_OPEN"),
    WINDOW_CLOSED: t("dispute.errors.WINDOW_CLOSED"),
    INVALID_BODY: t("dispute.errors.INVALID_BODY"),
    DEFAULT: t("dispute.errors.DEFAULT"),
  };
  const [reason, setReason] = useState("no_show");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, description: description.trim() }),
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
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="space-y-2 text-sm">
        {REASONS.map((r) => (
          <label key={r} className="flex items-center gap-2">
            <input
              type="radio"
              name="reason"
              checked={reason === r}
              onChange={() => setReason(r)}
            />
            {t(`dispute.reasons.${r}`)}
          </label>
        ))}
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={5}
        placeholder={t("dispute.ph")}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        disabled={busy || description.trim().length < 10}
        className="w-full rounded bg-red-600 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {busy ? t("common.sending") : t("dispute.submit")}
      </button>
    </form>
  );
}

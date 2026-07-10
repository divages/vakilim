"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ResponseForm({ disputeId }: { disputeId: string }) {
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    UNAUTHORIZED: t("lawD.errors.UNAUTHORIZED"),
    INVALID_STATE: t("lawD.errors.INVALID_STATE"),
    INVALID_BODY: t("lawD.errors.INVALID_BODY"),
    NOT_FOUND: t("lawD.errors.NOT_FOUND"),
    DEFAULT: t("lawD.errors.DEFAULT"),
  };
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/lawyer/disputes/${disputeId}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
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
    <form
      className="mt-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={t("lawD.ph")}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        disabled={busy || text.trim().length < 10}
        className="mt-2 rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark disabled:opacity-50"
      >
        {busy ? "…" : t("lawD.send")}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ReplyForm({ reviewId }: { reviewId: string }) {
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    UNAUTHORIZED: t("lawR.errors.UNAUTHORIZED"),
    ALREADY_REPLIED: t("lawR.errors.ALREADY_REPLIED"),
    INVALID_BODY: t("lawR.errors.INVALID_BODY"),
    NOT_FOUND: t("lawR.errors.NOT_FOUND"),
    DEFAULT: t("lawR.errors.DEFAULT"),
  };
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
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
        rows={2}
        placeholder={t("lawR.ph")}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <button
        disabled={busy || text.trim().length < 5}
        className="mt-2 rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark disabled:opacity-50"
      >
        {busy ? "…" : t("lawR.send")}
      </button>
    </form>
  );
}

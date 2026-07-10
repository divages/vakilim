"use client";

import { useState } from "react";

const ERRORS: Record<string, string> = {
  UNAUTHORIZED: "Sessiya bitib. Yenidən daxil olun.",
  INVALID_STATE: "Bu şikayətin statusu dəyişib. Səhifəni yeniləyin.",
  INVALID_BODY: "Cavabı ən azı 10 simvolla yazın.",
  NOT_FOUND: "Şikayət tapılmadı.",
  DEFAULT: "Xəta baş verdi. Bir az sonra yenidən cəhd edin.",
};

export default function ResponseForm({ disputeId }: { disputeId: string }) {
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
        placeholder="Baş verənlər barədə izahınızı yazın…"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        disabled={busy || text.trim().length < 10}
        className="mt-2 rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark disabled:opacity-50"
      >
        {busy ? "…" : "Cavab göndər"}
      </button>
    </form>
  );
}

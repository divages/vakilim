"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const TAGS = ["clear", "on_time", "solved", "professional"] as const;

export default function ReviewForm({ bookingId }: { bookingId: string }) {
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    UNAUTHORIZED: t("review.errors.UNAUTHORIZED"),
    NOT_ELIGIBLE: t("review.errors.NOT_ELIGIBLE"),
    ALREADY_REVIEWED: t("review.errors.ALREADY_REVIEWED"),
    INVALID_BODY: t("review.errors.INVALID_BODY"),
    DEFAULT: t("review.errors.DEFAULT"),
  };
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleTag(slug: string) {
    setTags((t) =>
      t.includes(slug) ? t.filter((x) => x !== slug) : [...t, slug]
    );
  }

  async function submit() {
    if (stars < 1) {
      setError(ERRORS.INVALID_BODY);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, tags, text: text.trim() || undefined }),
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
      className="mt-6 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex justify-center gap-2 text-3xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            aria-label={`${n} ulduz`}
            className={n <= stars ? "text-amber-400" : "text-gray-300"}
          >
            ★
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`rounded-full border px-3 py-1 text-sm ${
              tags.includes(tag)
                ? "border-navy bg-navy text-white"
                : "border-gray-300 text-slate hover:border-navy"
            }`}
          >
            {t(`common.tags.${tag}`)}
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder={t("review.ph")}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        disabled={busy}
        className="w-full rounded bg-navy py-2.5 font-medium text-white hover:bg-navy-dark disabled:opacity-50"
      >
        {busy ? t("common.sending") : t("review.submit")}
      </button>
    </form>
  );
}

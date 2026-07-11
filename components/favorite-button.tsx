"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function FavoriteButton({
  profileId,
  initial,
  className = "",
}: {
  profileId: string;
  initial: boolean;
  className?: string;
}) {
  const t = useTranslations();
  const [fav, setFav] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    setFav((v) => !v); // optimistic
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lawyerProfileId: profileId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) setFav((v) => !v); // revert
    } catch {
      setFav((v) => !v);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={fav}
      aria-label={t("common.favAria")}
      className={`rounded-full p-2 text-lg leading-none transition ${
        fav ? "text-red-500" : "text-gray-300 hover:text-red-400"
      } ${className}`}
    >
      {fav ? "♥" : "♡"}
    </button>
  );
}

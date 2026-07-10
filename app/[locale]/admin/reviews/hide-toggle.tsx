"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function HideToggle({
  id,
  hidden,
}: {
  id: string;
  hidden: boolean;
}) {
  const t = useTranslations();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reviews/${id}/hide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !hidden }),
      });
      if (res.ok) window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded border px-3 py-1.5 text-xs disabled:opacity-50 ${
        hidden
          ? "border-gray-300 hover:border-navy"
          : "border-red-300 text-red-700 hover:bg-red-50"
      }`}
    >
      {hidden ? t("admRev.show") : t("admRev.hide")}
    </button>
  );
}

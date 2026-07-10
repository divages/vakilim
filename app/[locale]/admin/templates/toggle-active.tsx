"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ToggleActive({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const t = useTranslations();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/templates/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
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
      className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:border-navy disabled:opacity-50"
    >
      {active ? t("admT.deactivate") : t("admT.activate")}
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      disabled={busy}
      className="rounded border border-white/30 px-3 py-1.5 hover:bg-white/10 disabled:opacity-50"
    >
      Çıxış
    </button>
  );
}

"use client";

import { useEffect } from "react";

/**
 * Persists the visitor's current UI locale to their account so that
 * emails and other out-of-band messages arrive in the right language.
 * Fire-and-forget; a sessionStorage guard keeps it to one call per
 * locale per tab session.
 */
export default function LocaleSync({
  locale,
  loggedIn,
}: {
  locale: string;
  loggedIn: boolean;
}) {
  useEffect(() => {
    if (!loggedIn) return;
    try {
      if (sessionStorage.getItem("localeSynced") === locale) return;
      fetch("/api/me/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      })
        .then(() => sessionStorage.setItem("localeSynced", locale))
        .catch(() => {});
    } catch {
      /* storage unavailable — sync silently skipped */
    }
  }, [locale, loggedIn]);
  return null;
}

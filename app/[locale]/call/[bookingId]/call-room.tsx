"use client";

import { useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { useTranslations } from "next-intl";

export default function CallRoom({
  bookingId,
  backHref,
  otherName,
  durationMin,
}: {
  bookingId: string;
  backHref: string;
  otherName: string;
  durationMin: number;
}) {
  const t = useTranslations();
  const ERRORS: Record<string, string> = {
    UNAUTHORIZED: t("call.errors.UNAUTHORIZED"),
    FORBIDDEN: t("call.errors.FORBIDDEN"),
    NOT_FOUND: t("call.errors.NOT_FOUND"),
    INVALID_STATE: t("call.errors.INVALID_STATE"),
    TOO_EARLY: t("call.errors.TOO_EARLY"),
    TOO_LATE: t("call.errors.TOO_LATE"),
    CONSENT_REQUIRED: t("call.errors.CONSENT_REQUIRED"),
    SERVER_CONFIG: t("call.errors.SERVER_CONFIG"),
    DEFAULT: t("call.errors.DEFAULT"),
  };
  const [conn, setConn] = useState<{ token: string; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function joinWithConsent() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/call-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        return;
      }
      setConn({ token: data.token, url: data.url });
    } catch {
      setError(ERRORS.DEFAULT);
    } finally {
      setBusy(false);
    }
  }

  if (!conn) {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <h1 className="text-xl font-bold text-navy">
          {t("call.with", { name: otherName })} · {durationMin} {t("common.min")}
        </h1>
        <div className="mt-6 rounded border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed">
          {t("call.consent")}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          onClick={joinWithConsent}
          disabled={busy}
          className="mt-6 w-full rounded bg-navy py-3 font-medium text-white hover:bg-navy-dark disabled:opacity-50"
        >
          {busy ? t("call.joining") : t("call.agreeJoin")}
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: "calc(100dvh - 120px)" }} data-lk-theme="default">
      <LiveKitRoom
        serverUrl={conn.url}
        token={conn.token}
        connect
        audio
        video
        onConnected={() => {
          fetch(`/api/bookings/${bookingId}/recording/start`, {
            method: "POST",
          }).catch(() => {});
        }}
        onDisconnected={() => {
          window.location.href = backHref;
        }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}

"use client";

import { useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";

const ERRORS: Record<string, string> = {
  UNAUTHORIZED: "Sessiya bitib. Yenidən daxil olun.",
  FORBIDDEN: "Bu görüşə giriş icazəniz yoxdur.",
  NOT_FOUND: "Görüş tapılmadı.",
  INVALID_STATE: "Görüş aktiv deyil.",
  TOO_EARLY: "Görüş hələ başlamayıb. Bir az sonra yenidən cəhd edin.",
  TOO_LATE: "Görüşün vaxtı bitib.",
  CONSENT_REQUIRED: "Davam etmək üçün razılıq tələb olunur.",
  SERVER_CONFIG: "Video sistemi hələ qurulmayıb (LiveKit açarları çatışmır).",
  DEFAULT: "Xəta baş verdi. Bir az sonra yenidən cəhd edin.",
};

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
          {otherName} ilə görüş · {durationMin} dəq
        </h1>
        <div className="mt-6 rounded border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed">
          Görüş keyfiyyətə nəzarət və mübahisələrin həlli məqsədilə qeydə
          alına bilər. Davam etməklə buna razılıq verirsiniz. Kamera və
          mikrofonunuza icazə istəniləcək.
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          onClick={joinWithConsent}
          disabled={busy}
          className="mt-6 w-full rounded bg-navy py-3 font-medium text-white hover:bg-navy-dark disabled:opacity-50"
        >
          {busy ? "Qoşulur…" : "Razıyam və qoşul"}
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
        onDisconnected={() => {
          window.location.href = backHref;
        }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}

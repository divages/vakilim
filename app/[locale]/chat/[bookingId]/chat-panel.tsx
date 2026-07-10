"use client";

import { useEffect, useRef, useState } from "react";

type Msg = {
  id: string;
  senderId: string;
  body: string;
  attachmentName: string | null;
  hasAttachment: boolean;
  createdAt: string;
};

const ERRORS: Record<string, string> = {
  UNAUTHORIZED: "Sessiya bitib. Yenidən daxil olun.",
  READ_ONLY: "Yazışma müddəti bitib.",
  EMPTY: "Boş mesaj göndərilə bilməz.",
  FILE_TOO_LARGE: "Fayl 10 MB-dan böyük ola bilməz.",
  FILE_TYPE: "Yalnız PDF, şəkil və DOCX faylları göndərilə bilər.",
  SERVER_CONFIG: "Fayl anbarı konfiqurasiya olunmayıb.",
  DEFAULT: "Xəta baş verdi. Bir az sonra yenidən cəhd edin.",
};

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("az-AZ", {
    timeZone: "Asia/Baku",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPanel({
  bookingId,
  meId,
  writable,
}: {
  bookingId: string;
  meId: string;
  writable: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const countRef = useRef(0);

  async function load() {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/messages`);
      const data = await res.json();
      if (data.ok) {
        setMessages(data.messages);
        if (data.messages.length !== countRef.current) {
          countRef.current = data.messages.length;
          setTimeout(
            () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
            50
          );
        }
      }
    } catch {
      /* polling: silent */
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  async function send() {
    if (!body.trim() && !file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("body", body.trim());
      if (file) fd.set("file", file);
      const res = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(ERRORS[data.error] ?? ERRORS.DEFAULT);
        return;
      }
      setBody("");
      setFile(null);
      await load();
    } catch {
      setError(ERRORS.DEFAULT);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mt-4 flex-1 space-y-2 overflow-y-auto rounded border border-gray-200 p-3">
        {messages.length === 0 && (
          <p className="p-4 text-center text-sm text-slate">
            Hələ mesaj yoxdur.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === meId;
          return (
            <div key={m.id} className={mine ? "flex justify-end" : "flex"}>
              <div
                className={`max-w-[80%] rounded px-3 py-2 text-sm ${
                  mine ? "bg-navy text-white" : "bg-gray-100 text-navy"
                }`}
              >
                {m.body && <p className="whitespace-pre-line">{m.body}</p>}
                {m.hasAttachment && (
                  <a
                    href={`/api/bookings/${bookingId}/attachments/${m.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-1 block text-xs underline ${
                      mine ? "text-white/90" : "text-navy"
                    }`}
                  >
                    📎 {m.attachmentName ?? "Fayl"}
                  </a>
                )}
                <p
                  className={`mt-1 text-right text-[10px] ${
                    mine ? "text-white/60" : "text-slate"
                  }`}
                >
                  {timeLabel(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {writable ? (
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          {file && (
            <p className="mb-2 text-xs text-slate">
              📎 {file.name}{" "}
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-red-600 underline"
              >
                sil
              </button>
            </p>
          )}
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded border border-gray-300 px-3 py-2 text-sm hover:border-navy">
              📎
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Mesaj yazın…"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
            />
            <button
              disabled={busy || (!body.trim() && !file)}
              className="rounded bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark disabled:opacity-50"
            >
              {busy ? "…" : "Göndər"}
            </button>
          </div>
        </form>
      ) : null}
    </>
  );
}

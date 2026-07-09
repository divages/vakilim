"use client";

import { useState } from "react";

export type Application = {
  id: string;
  fullName: string;
  phone: string;
  type: "ADVOCATE" | "LICENSED_LAWYER";
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  licenseNo: string;
  yearsExperience: number;
  city: string;
  bio: string;
  languages: string[];
  areas: string[];
  licenseDocUrl: string | null;
  licenseDocIsPdf: boolean;
  idDocUrl: string | null;
  idDocIsPdf: boolean;
};

const TYPE_LABELS: Record<Application["type"], string> = {
  ADVOCATE: "Vəkil (Kollegiya üzvü)",
  LICENSED_LAWYER: "Hüquqşünas",
};

const STATUS_BADGES: Record<Application["status"], { label: string; cls: string }> = {
  PENDING: { label: "Gözləyir", cls: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Təsdiqlənib", cls: "bg-emerald/15 text-navy" },
  REJECTED: { label: "Rədd edilib", cls: "bg-red-100 text-red-700" },
};

const ERRORS: Record<string, string> = {
  FORBIDDEN: "Bu əməliyyat üçün icazəniz yoxdur.",
  NOT_FOUND: "Müraciət tapılmadı. Səhifəni yeniləyin.",
  REASON_REQUIRED: "Rədd üçün səbəb yazın (ən azı 5 simvol).",
  INVALID_BODY: "Məlumatlar düzgün deyil.",
  DEFAULT: "Xəta baş verdi. Bir az sonra yenidən cəhd edin.",
};

export default function ReviewCard({ app }: { app: Application }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(action: "APPROVE" | "REJECT") {
    if (action === "REJECT" && reason.trim().length < 5) {
      setError(ERRORS.REASON_REQUIRED);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/verifications/${app.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "REJECT" ? { action, reason: reason.trim() } : { action }
        ),
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

  const badge = STATUS_BADGES[app.status];

  return (
    <div className="rounded border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-navy">{app.fullName}</p>
          <p className="text-sm">{app.phone}</p>
        </div>
        <span className={`rounded px-2 py-1 text-xs font-medium ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <Row k="Status" v={TYPE_LABELS[app.type]} />
        <Row k="Lisenziya №" v={app.licenseNo} />
        <Row k="Şəhər" v={app.city} />
        <Row k="Təcrübə" v={`${app.yearsExperience} il`} />
        <Row k="Dillər" v={app.languages.join(", ")} />
        <Row k="Sahələr" v={app.areas.join(", ")} />
      </dl>

      <p className="mt-3 rounded bg-gray-50 p-3 text-sm">{app.bio}</p>

      <div className="mt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate">
          Sənədlər
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <DocTile label="Lisenziya" url={app.licenseDocUrl} isPdf={app.licenseDocIsPdf} />
          <DocTile label="Şəxsiyyət vəsiqəsi" url={app.idDocUrl} isPdf={app.idDocIsPdf} />
        </div>
      </div>

      {app.status === "REJECTED" && app.rejectionReason && (
        <p className="mt-2 text-sm text-red-700">
          Səbəb: {app.rejectionReason}
        </p>
      )}

      {rejecting && (
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Rədd səbəbi (vəkilə göstəriləcək)…"
          className="mt-3 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy"
          autoFocus
        />
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex gap-3">
        {!rejecting ? (
          <>
            <button
              onClick={() => decide("APPROVE")}
              disabled={busy || app.status === "APPROVED"}
              className="rounded bg-emerald px-4 py-2 text-sm font-medium text-navy-dark hover:opacity-90 disabled:opacity-40"
            >
              {busy ? "…" : "Təsdiqlə"}
            </button>
            <button
              onClick={() => setRejecting(true)}
              disabled={busy || app.status === "REJECTED"}
              className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
            >
              Rədd et
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => decide("REJECT")}
              disabled={busy}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? "…" : "Rəddi təsdiqlə"}
            </button>
            <button
              onClick={() => {
                setRejecting(false);
                setReason("");
                setError(null);
              }}
              disabled={busy}
              className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              İmtina
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function DocTile({
  label,
  url,
  isPdf,
}: {
  label: string;
  url: string | null;
  isPdf: boolean;
}) {
  if (!url)
    return (
      <span className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-slate">
        {label}: sənəd yoxdur
      </span>
    );
  if (isPdf)
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="rounded border border-gray-300 px-3 py-2 text-xs font-medium text-navy hover:border-navy"
      >
        📄 {label} (PDF)
      </a>
    );
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={label}
        className="h-24 w-36 rounded border border-gray-200 object-cover hover:border-navy"
      />
      <span className="mt-1 block text-center text-xs text-slate">{label}</span>
    </a>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 sm:justify-start">
      <dt className="text-slate">{k}:</dt>
      <dd className="font-medium text-navy">{v}</dd>
    </div>
  );
}

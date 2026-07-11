"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type R = {
  id: string; kind: "CODE" | "LAW"; slug: string; sortOrder: number; published: boolean;
  titleAz: string; titleRu: string | null; titleEn: string | null;
  bodyAz: string; bodyRu: string | null; bodyEn: string | null;
};
const EMPTY = {
  kind: "CODE" as "CODE" | "LAW", slug: "", sortOrder: 0,
  titleAz: "", titleRu: "", titleEn: "",
  bodyAz: "", bodyRu: "", bodyEn: "",
};

export default function LawsEditor({ rows }: { rows: R[] }) {
  const t = useTranslations();
  const [list, setList] = useState(rows);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function open(r?: R) {
    setMsg(null);
    if (r) {
      setEditing(r.id);
      setForm({
        kind: r.kind, slug: r.slug, sortOrder: r.sortOrder,
        titleAz: r.titleAz, titleRu: r.titleRu ?? "", titleEn: r.titleEn ?? "",
        bodyAz: r.bodyAz, bodyRu: r.bodyRu ?? "", bodyEn: r.bodyEn ?? "",
      });
    } else {
      setEditing("new");
      setForm({ ...EMPTY });
    }
  }

  async function save() {
    if (busy) return;
    setBusy(true); setMsg(null);
    try {
      const url = editing === "new" ? "/api/admin/laws" : `/api/admin/laws/${editing}`;
      const res = await fetch(url, {
        method: editing === "new" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) || 0 }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMsg(data?.error === "SLUG_TAKEN" ? t("admP.slugTaken") : t("admP.err"));
        return;
      }
      window.location.reload();
    } finally { setBusy(false); }
  }

  async function togglePublish(r: R) {
    await fetch(`/api/admin/laws/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !r.published }),
    });
    setList((l) => l.map((x) => (x.id === r.id ? { ...x, published: !x.published } : x)));
  }

  const inputCls = "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald";
  const areaCls = inputCls + " min-h-64 font-mono text-xs";
  const lbl = "mt-3 block text-xs font-semibold uppercase text-slate";
  const F = (k: keyof typeof EMPTY) => ({
    value: String(form[k] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  return (
    <div className="mt-6">
      <button onClick={() => open()} className="rounded-xl bg-emerald px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
        + {t("admL.new")}
      </button>
      <div className="mt-5 space-y-3">
        {list.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-navy">{r.titleAz}</p>
              <p className="text-xs text-slate">{r.kind} · /{r.slug}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.published ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-slate-600"}`}>
                {r.published ? t("admP.pub") : t("admP.draft")}
              </span>
              <button onClick={() => togglePublish(r)} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-navy hover:border-navy">
                {r.published ? t("admP.unpublish") : t("admP.publish")}
              </button>
              <button onClick={() => open(r)} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-navy hover:border-navy">
                {t("admP.edit")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={lbl}>{t("admP.kind")}</label>
              <select {...F("kind")} className={inputCls}>
                <option value="CODE">{t("laws.codes")}</option>
                <option value="LAW">{t("laws.laws")}</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Slug</label>
              <input {...F("slug")} className={inputCls} placeholder="mulki-mecelle" />
            </div>
            <div>
              <label className={lbl}>{t("admQ.order")}</label>
              <input {...F("sortOrder")} className={inputCls} inputMode="numeric" />
            </div>
          </div>
          {(["Az", "Ru", "En"] as const).map((L) => (
            <div key={L} className="mt-4 rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-bold text-emerald">{L.toUpperCase()}</p>
              <label className={lbl}>{t("admP.postTitle")}</label>
              <input {...F(("title" + L) as keyof typeof EMPTY)} className={inputCls} />
              <label className={lbl}>{t("admL.body")} — {t("admL.bodyHint")}</label>
              <textarea {...F(("body" + L) as keyof typeof EMPTY)} className={areaCls} />
            </div>
          ))}
          {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
          <div className="mt-5 flex gap-3">
            <button onClick={save} disabled={busy} className="rounded-xl bg-navy px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {t("admP.save")}
            </button>
            <button onClick={() => setEditing(null)} className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-navy hover:border-navy">
              {t("admP.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

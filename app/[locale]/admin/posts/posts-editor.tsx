"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type P = {
  id: string; kind: "BLOG" | "NEWS"; slug: string;
  titleAz: string; titleRu: string | null; titleEn: string | null;
  excerptAz: string; excerptRu: string | null; excerptEn: string | null;
  bodyAz: string; bodyRu: string | null; bodyEn: string | null;
  coverUrl: string | null; authorName: string | null; practiceAreaSlug: string | null; byLawyer: boolean; published: boolean;
};
const EMPTY: Omit<P, "id" | "published" | "byLawyer"> = {
  kind: "BLOG", slug: "", titleAz: "", titleRu: "", titleEn: "",
  excerptAz: "", excerptRu: "", excerptEn: "", bodyAz: "", bodyRu: "", bodyEn: "",
  coverUrl: "", authorName: "", practiceAreaSlug: "",
};

export default function PostsEditor({ posts, areas }: { posts: P[]; areas: { slug: string; nameAz: string }[] }) {
  const t = useTranslations();
  const [list, setList] = useState(posts);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function open(p?: P) {
    setMsg(null);
    if (p) {
      setEditing(p.id);
      setForm({ ...p, titleRu: p.titleRu ?? "", titleEn: p.titleEn ?? "",
        excerptRu: p.excerptRu ?? "", excerptEn: p.excerptEn ?? "",
        bodyRu: p.bodyRu ?? "", bodyEn: p.bodyEn ?? "",
        coverUrl: p.coverUrl ?? "", authorName: p.authorName ?? "", practiceAreaSlug: p.practiceAreaSlug ?? "" });
    } else {
      setEditing("new");
      setForm({ ...EMPTY });
    }
  }

  async function save() {
    if (busy) return;
    setBusy(true); setMsg(null);
    try {
      const url = editing === "new" ? "/api/admin/posts" : `/api/admin/posts/${editing}`;
      const res = await fetch(url, {
        method: editing === "new" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMsg(data?.error === "SLUG_TAKEN" ? t("admP.slugTaken") : t("admP.err"));
        return;
      }
      window.location.reload();
    } finally { setBusy(false); }
  }

  async function togglePublish(p: P) {
    await fetch(`/api/admin/posts/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !p.published }),
    });
    setList((l) => l.map((x) => (x.id === p.id ? { ...x, published: !x.published } : x)));
  }

  const inputCls = "mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald";
  const areaCls = inputCls + " min-h-28 font-mono";
  const lbl = "mt-3 block text-xs font-semibold uppercase text-slate";
  const F = (k: keyof typeof form) => ({
    value: (form[k] ?? "") as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  return (
    <div className="mt-6">
      <button onClick={() => open()} className="rounded-xl bg-emerald px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
        + {t("admP.new")}
      </button>

      <div className="mt-5 space-y-3">
        {list.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <div className="min-w-0">
              <p className="truncate font-bold text-navy">{p.titleAz}</p>
              <p className="text-xs text-slate">
                {p.kind} · /{p.slug}
                {p.byLawyer && (
                  <span className="ml-2 rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-semibold text-navy">
                    {t("admP.byLawyer")}
                  </span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.published ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-slate-600"}`}>
                {p.published ? t("admP.pub") : t("admP.draft")}
              </span>
              <button onClick={() => togglePublish(p)} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-navy hover:border-navy">
                {p.published ? t("admP.unpublish") : t("admP.publish")}
              </button>
              <button onClick={() => open(p)} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-navy hover:border-navy">
                {t("admP.edit")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-navy">
            {editing === "new" ? t("admP.new") : t("admP.edit")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>{t("admP.kind")}</label>
              <select {...F("kind")} className={inputCls}>
                <option value="BLOG">Blog</option>
                <option value="NEWS">News</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Slug (a-z, 0-9, -)</label>
              <input {...F("slug")} className={inputCls} placeholder="mehkeme-prosesi-nece-kecir" />
            </div>
            <div>
              <label className={lbl}>{t("admP.area")}</label>
              <select {...F("practiceAreaSlug")} className={inputCls}>
                <option value="">—</option>
                {areas.map((a) => (
                  <option key={a.slug} value={a.slug}>{a.nameAz}</option>
                ))}
              </select>
            </div>
          </div>
          {(["Az", "Ru", "En"] as const).map((L) => (
            <div key={L} className="mt-4 rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-bold text-emerald">{L.toUpperCase()}</p>
              <label className={lbl}>{t("admP.postTitle")}</label>
              <input {...F(("title" + L) as keyof typeof form)} className={inputCls} />
              <label className={lbl}>{t("admP.excerpt")}</label>
              <input {...F(("excerpt" + L) as keyof typeof form)} className={inputCls} />
              <label className={lbl}>{t("admP.body")} (##, **bold**, [link](url))</label>
              <textarea {...F(("body" + L) as keyof typeof form)} className={areaCls} />
            </div>
          ))}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>{t("admP.cover")}</label>
              <input {...F("coverUrl")} className={inputCls} placeholder="https://…/image.jpg" />
            </div>
            <div>
              <label className={lbl}>{t("admP.author")}</label>
              <input {...F("authorName")} className={inputCls} />
            </div>
          </div>
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

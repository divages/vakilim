// Run: node scripts/i18n-check.mjs
// Fails (exit 1) on hardcoded Azerbaijani outside whitelists, or on
// any key-set divergence between messages/az|ru|en.json.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "app/[locale]";
const WL = ["50 123 45 67", "Azərbaycanca təqdimat", "Представление", 'useState("Bakı")', '"az-AZ"', "ad@nümunə", '{"{{sahə}}"}'];
const LEGAL = ["terms", "privacy", "refund-policy"];
const AZ = /[əığşöüçƏİĞŞÇÖÜ]/;

function* walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (n.endsWith(".tsx")) yield p;
  }
}
let bad = 0;
for (const f of walk(ROOT)) {
  if (LEGAL.some((d) => f.includes(`${d}\\`) || f.includes(`${d}/`))) continue;
  const lines = readFileSync(f, "utf8").split("\n");
  let meta = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("export const metadata") || line.startsWith("export async function generateMetadata")) meta = true;
    if (meta) { if (line === "};" || line === "}") meta = false; continue; }
    if (AZ.test(line) && !WL.some((w) => line.includes(w))) {
      console.error(`AZ leftover  ${f}:${i + 1}  ${line.trim().slice(0, 80)}`);
      bad++; break;
    }
  }
}
const keys = (o, pre = "") =>
  Object.entries(o).flatMap(([k, v]) =>
    typeof v === "object" ? keys(v, pre + k + ".") : [pre + k]
  );
const [az, ru, en] = ["az", "ru", "en"].map((l) =>
  new Set(keys(JSON.parse(readFileSync(`messages/${l}.json`, "utf8"))))
);
for (const [a, b, name] of [[az, ru, "az↔ru"], [az, en, "az↔en"]]) {
  const diff = [...a].filter((k) => !b.has(k)).concat([...b].filter((k) => !a.has(k)));
  if (diff.length) { console.error(`Key divergence ${name}:`, diff.slice(0, 10)); bad++; }
}
if (bad) { console.error(`\ni18n-check FAILED (${bad} problems)`); process.exit(1); }
console.log(`i18n-check OK — ${az.size} keys parallel across az/ru/en, no leftovers`);

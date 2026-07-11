// Query-bounds guard: flags findMany calls lacking `take:` unless preceded
// by an `unbounded-ok` comment within 160 chars. Report mode by default;
// `--strict` exits 1 on violations.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const strict = process.argv.includes("--strict");
const files = [];
function walk(d) {
  let names;
  try { names = readdirSync(d); } catch { return; }
  for (const n of names) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(n)) files.push(p);
  }
}
["app", "components", "lib"].forEach(walk);

const violations = [];
for (const f of files) {
  const s = readFileSync(f, "utf8");
  let i = 0;
  while ((i = s.indexOf(".findMany({", i)) !== -1) {
    const before = s.slice(Math.max(0, i - 160), i);
    let d = 0, end = s.length;
    for (let j = i + ".findMany(".length; j < s.length; j++) {
      const c = s[j];
      if (c === "(" || c === "{" || c === "[") d++;
      else if (c === ")" || c === "}" || c === "]") d--;
      if (d === 0) { end = j; break; }
    }
    if (!/\btake\s*:/.test(s.slice(i, end)) && !before.includes("unbounded-ok"))
      violations.push(`${f}:${s.slice(0, i).split("\n").length}`);
    i = end;
  }
}
if (violations.length) {
  console.log(`query-bounds: ${violations.length} unbounded findMany site(s)`);
  for (const v of violations) console.log("  " + v);
  if (strict) process.exit(1);
} else {
  console.log("query-bounds: all findMany calls bounded or annotated");
}

/** Tiny, safe markdown subset: ## headings, **bold**, [text](https url),
 *  blank-line paragraphs. Input is HTML-escaped BEFORE transforms. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9əöüğışç\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

/** Extracts ## headings for a table of contents. */
export function extractToc(src: string): { id: string; text: string }[] {
  return src
    .split(/\n/)
    .filter((l) => l.startsWith("## "))
    .map((l) => {
      const text = l.slice(3).trim();
      return { id: headingId(text), text };
    });
}

export function renderLiteMarkdown(src: string, withIds = false): string {
  const blocks = esc(src).replace(/\r\n/g, "\n").split(/\n\n+/);
  return blocks
    .map((b) => {
      const t = b.trim();
      if (!t) return "";
      let html = t
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(
          /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
          '<a href="$2" rel="noopener noreferrer" target="_blank">$1</a>'
        )
        .replace(/\n/g, "<br/>");
      if (html.startsWith("### ")) return `<h3>${html.slice(4)}</h3>`;
      if (html.startsWith("## ")) {
        const inner = html.slice(3);
        return withIds
          ? `<h2 id="${headingId(inner)}">${inner}</h2>`
          : `<h2>${inner}</h2>`;
      }
      return `<p>${html}</p>`;
    })
    .join("\n");
}

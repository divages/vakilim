/** Tiny, safe markdown subset: ## headings, **bold**, [text](https url),
 *  blank-line paragraphs. Input is HTML-escaped BEFORE transforms. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderLiteMarkdown(src: string): string {
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
      if (html.startsWith("## ")) return `<h2>${html.slice(3)}</h2>`;
      return `<p>${html}</p>`;
    })
    .join("\n");
}

import { describe, expect, it } from "vitest";
import { renderLiteMarkdown, extractToc } from "@/lib/markdown-lite";

describe("renderLiteMarkdown", () => {
  it("escapes HTML before transforming", () => {
    const out = renderLiteMarkdown("<script>x</script> **b**");
    expect(out).toContain("&lt;script&gt;");
    expect(out).toContain("<strong>b</strong>");
  });

  it("renders headings, links and paragraphs", () => {
    const out = renderLiteMarkdown("## Başlıq\n\nMətn [link](https://vakilim.az)\n\nİkinci abzas");
    expect(out).toContain("<h2>Başlıq</h2>");
    expect(out).toContain('href="https://vakilim.az"');
    expect(out.match(/<p>/g)?.length).toBe(2);
  });

  it("assigns heading ids and extracts a TOC", () => {
    const src = "## Ümumi müddəalar\n\nMətn\n\n## İkinci fəsil";
    const toc = extractToc(src);
    expect(toc.length).toBe(2);
    expect(toc[0].id).toBe("ümumi-müddəalar");
    expect(renderLiteMarkdown(src, true)).toContain('id="ümumi-müddəalar"');
  });
});

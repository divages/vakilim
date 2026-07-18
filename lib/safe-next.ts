/**
 * FIX for audit §2.1 — open redirect via backslash bypass.
 *
 * The five call sites that read a `next` / `returnTo` param currently use
 *   raw.startsWith("/") && !raw.startsWith("//")
 * which the WHATWG URL parser defeats: it treats "\" as "/" and strips
 * tabs/newlines, so "/\evil.com" resolves to https://evil.com/ .
 *
 * Resolve the value against our own origin FIRST, then compare the
 * resulting origin. Never pattern-match on the raw string.
 *
 * Call sites to convert (see MANIFEST for the exact edit at each):
 *   - app/api/auth/verify-email/route.ts
 *   - app/api/auth/google/route.ts
 *   - app/api/auth/google/callback/route.ts
 *   - app/[locale]/complete-phone/page.tsx
 *   - app/[locale]/login/page.tsx
 *
 * SITE_ORIGIN must be your canonical origin. It is read from
 * NEXT_PUBLIC_APP_URL so preview deploys don't send production links
 * (see audit §4.2). Add NEXT_PUBLIC_APP_URL to .env / .env.example.
 */

const SITE_ORIGIN = (() => {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? "https://vakilim.az";
  try {
    return new URL(raw).origin;
  } catch {
    return "https://vakilim.az";
  }
})();

/**
 * Returns a safe same-origin path (pathname + search + hash) or the
 * fallback. Never returns an absolute URL and never returns a
 * different origin, regardless of how the input is crafted.
 */
export function safeNext(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  let resolved: URL;
  try {
    resolved = new URL(raw, SITE_ORIGIN);
  } catch {
    return fallback;
  }
  if (resolved.origin !== SITE_ORIGIN) return fallback;
  // Reconstruct from parsed parts so no smuggled scheme/host survives.
  return `${resolved.pathname}${resolved.search}${resolved.hash}` || fallback;
}

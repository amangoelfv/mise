/**
 * Deterministic name normalization for catalog lookup and product matching.
 * Lower-case, strip accents/punctuation, collapse whitespace. Plurals and brand
 * variants are handled by explicit catalog aliases, not stemming, so matching
 * stays predictable and testable.
 */

// Unicode combining diacritical marks (U+0300–U+036F), left over after NFKD.
const COMBINING_MARKS = /[̀-ͯ]/g;

export function normalizeName(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Looser key that drops a single trailing plural "s" (tomatoes -> tomatoe). */
export function pluralInsensitiveKey(raw: string): string {
  const normalized = normalizeName(raw);
  return normalized.endsWith("s") ? normalized.slice(0, -1) : normalized;
}

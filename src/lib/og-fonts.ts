/**
 * TTF subsets for next/og images (Satori can't read woff2). Fetched from the Google Fonts CSS API
 * with only the glyphs used; on any failure the image falls back to the default font.
 */
async function googleFont(family: string, axes: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${family}:${axes}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl)).text();
    const src = /src:\s*url\(([^)]+)\)\s*format\('(?:opentype|truetype)'\)/.exec(css)?.[1];
    if (!src) return null;
    const res = await fetch(src);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 500 | 600 | 700; style: "normal" };

/** Archivo Expanded (wordmark), Archivo SemiExpanded (headlines), JetBrains Mono (labels). */
export async function ogFonts(text: { wordmark: string; display: string; mono: string }): Promise<OgFont[]> {
  const [wordmark, display, mono] = await Promise.all([
    googleFont("Archivo", "wdth,wght@125,700", text.wordmark),
    googleFont("Archivo", "wdth,wght@112.5,600", text.display),
    googleFont("JetBrains+Mono", "wght@500", text.mono),
  ]);
  const fonts: OgFont[] = [];
  if (wordmark) fonts.push({ name: "Wordmark", data: wordmark, weight: 700, style: "normal" });
  if (display) fonts.push({ name: "Display", data: display, weight: 600, style: "normal" });
  if (mono) fonts.push({ name: "Mono", data: mono, weight: 500, style: "normal" });
  return fonts;
}

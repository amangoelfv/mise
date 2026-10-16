import { ImageResponse } from "next/og";
import { BRAND, markDots } from "@/components/brand";
import { ogFonts } from "@/lib/og-fonts";

export const alt = "Mise brand guidelines: logo, colour, type and voice.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SWATCHES: [string, string][] = [
  ["INK", BRAND.ink],
  ["PAPER", BRAND.paper],
  ["SAFFRON", BRAND.saffron],
  ["TURMERIC", BRAND.turmeric],
  ["HERB", BRAND.herb],
  ["CHILI", BRAND.chili],
];

export default async function BrandOpengraphImage() {
  const fonts = await ogFonts({
    wordmark: "mise",
    display: "Brand guidelines",
    mono: [...SWATCHES.flatMap(([n, h]) => [n, h.toUpperCase()]), "LOGO COLOUR TYPE VOICE · #"].join(""),
  });

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: BRAND.ink, color: BRAND.paper, padding: "72px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width={150} height={150} viewBox="0 0 7 7">
            {markDots().map((d) => (
              <circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={d.accent ? 0.46 : d.r} fill={d.accent ? BRAND.saffron : BRAND.paper} />
            ))}
          </svg>
          <div style={{ fontFamily: "Wordmark", fontSize: 170, letterSpacing: -8, lineHeight: 1 }}>mise</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 48 }}>
          <div style={{ fontFamily: "Display", fontSize: 54, letterSpacing: -1.5 }}>Brand guidelines</div>
          <div style={{ fontFamily: "Mono", fontSize: 20, letterSpacing: 4, color: "rgba(239,235,227,0.45)" }}>LOGO · COLOUR · TYPE · VOICE</div>
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: "auto" }}>
          {SWATCHES.map(([name, hex]) => (
            <div key={name} style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
              <div style={{ height: 96, borderRadius: 14, background: hex, border: "1px solid rgba(239,235,227,0.14)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontFamily: "Mono", fontSize: 16, letterSpacing: 2 }}>
                <span style={{ color: "rgba(239,235,227,0.75)" }}>{name}</span>
                <span style={{ color: "rgba(239,235,227,0.4)" }}>{hex.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

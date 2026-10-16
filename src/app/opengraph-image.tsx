import { ImageResponse } from "next/og";
import { BRAND, markDots } from "@/components/brand";
import { ogFonts } from "@/lib/og-fonts";

export const alt = "Mise: what do you want to eat today? Type a dish, get the grocery list and a Zepto cart.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const WORDMARK = "mise";
const HEADLINE = "What do you want to eat today?";
const LABELS = ["DISH", "STYLE", "LIST", "ZEPTO CART"];
const FOOTER = "BUILT WITH GEMINI";

export default async function OpengraphImage() {
  const fonts = await ogFonts({ wordmark: WORDMARK, display: HEADLINE, mono: [...LABELS, FOOTER, "0123456789→/"].join("") });
  const cell = 52;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: BRAND.ink,
          backgroundImage: "radial-gradient(circle, rgba(239,235,227,0.07) 1.4px, transparent 1.8px)",
          backgroundSize: "28px 28px",
          color: BRAND.paper,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <svg width={56} height={56} viewBox="0 0 7 7">
              {markDots().map((d) => (
                <circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={d.accent ? 0.46 : d.r} fill={d.accent ? BRAND.saffron : BRAND.paper} />
              ))}
            </svg>
            <div style={{ fontFamily: "Wordmark", fontSize: 64, letterSpacing: -3, lineHeight: 1 }}>{WORDMARK}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "Display", fontSize: 76, lineHeight: 1.0, letterSpacing: -2.5, maxWidth: 640 }}>
              {HEADLINE}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 36, fontFamily: "Mono", fontSize: 22, letterSpacing: 3 }}>
              {LABELS.map((label, i) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ color: i === LABELS.length - 1 ? BRAND.saffron : "rgba(239,235,227,0.6)" }}>{label}</span>
                  {i < LABELS.length - 1 && <span style={{ color: "rgba(239,235,227,0.25)" }}>→</span>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontFamily: "Mono", fontSize: 18, letterSpacing: 4, color: "rgba(239,235,227,0.4)" }}>{FOOTER}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: cell * 7 + 40 }}>
          <svg width={cell * 7} height={cell * 7} viewBox="0 0 7 7">
            {markDots().map((d) => (
              <circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={d.accent ? 0.46 : d.r} fill={d.accent ? BRAND.saffron : BRAND.paper} />
            ))}
          </svg>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

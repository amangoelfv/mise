import { ImageResponse } from "next/og";
import { BRAND, markDots } from "@/components/brand";

export const alt = "Mise: what do you want to eat today?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const cell = 46;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 96px",
          background: BRAND.ink,
          color: BRAND.paper,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: -6 }}>mise</div>
          <div style={{ marginTop: 18, fontSize: 44, maxWidth: 560, lineHeight: 1.15, opacity: 0.85 }}>
            What do you want to eat today?
          </div>
          <div style={{ marginTop: 40, fontSize: 24, color: BRAND.saffron, letterSpacing: 4 }}>DISH → LIST → ZEPTO CART</div>
        </div>
        <svg width={cell * 7} height={cell * 7} viewBox="0 0 7 7">
          {markDots().map((d) => (
            <circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={d.accent ? 0.46 : d.r} fill={d.accent ? BRAND.saffron : BRAND.paper} />
          ))}
        </svg>
      </div>
    ),
    size,
  );
}

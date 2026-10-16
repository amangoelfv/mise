import { ImageResponse } from "next/og";
import { BRAND, markDots } from "@/components/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon: the halftone mark on ink (iOS rounds the corners itself). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND.ink }}>
        <svg width={118} height={118} viewBox="0 0 7 7">
          {markDots().map((d) => (
            <circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={d.accent ? 0.46 : Math.max(d.r, 0.16)} fill={d.accent ? BRAND.saffron : BRAND.paper} />
          ))}
        </svg>
      </div>
    ),
    size,
  );
}

/**
 * Mise brand marks. The mark is a halftone sphere on a 7×7 grid: the grid is
 * "mise en place" (everything in its place), the shading is the orb, and the single
 * saffron dot is the highlight. Construction notes live in BRAND.md.
 */

export const BRAND = {
  ink: "#0b0a09",
  paper: "#efebe3",
  saffron: "#ff7a1a",
  turmeric: "#ffc24b",
  herb: "#8cd47e",
  chili: "#ff5c4d",
} as const;

type Dot = { x: number; y: number; r: number; accent: boolean };

/** Grid dots inside a circle, sized by Lambert light from the top-left. */
export function markDots(): Dot[] {
  const light = [-0.52, -0.6, 0.6];
  const len = Math.hypot(...light);
  const [lx, ly, lz] = light.map((v) => v / len);
  const dots: Dot[] = [];
  for (let j = 0; j < 7; j++) {
    for (let i = 0; i < 7; i++) {
      const x = i - 3;
      const y = j - 3;
      if (Math.hypot(x, y) > 3.2) continue;
      const nx = x / 3.45;
      const ny = y / 3.45;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const lit = Math.max(0, nx * lx + ny * ly + nz * lz);
      dots.push({ x: i + 0.5, y: j + 0.5, r: Math.round((0.1 + 0.36 * lit) * 1000) / 1000, accent: false });
    }
  }
  // The most lit dot becomes the saffron highlight.
  dots.reduce((best, d) => (d.r > best.r ? d : best)).accent = true;
  return dots;
}

const DOTS = markDots();

export function LogoMark({
  size = 22,
  color = "currentColor",
  accent = BRAND.saffron,
  className = "",
}: {
  size?: number;
  color?: string;
  accent?: string;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 7 7" className={className} aria-hidden>
      {DOTS.map((d) => (
        <circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={d.accent ? 0.46 : d.r} fill={d.accent ? accent : color} />
      ))}
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`wordmark ${className}`}>mise</span>;
}

export function Logo({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-paper ${className}`}>
      <LogoMark size={size} />
      <Wordmark className="text-[19px]" />
    </span>
  );
}

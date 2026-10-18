/**
 * Parser for Zepto's messy pack-size strings into a comparable base amount.
 * Built against real observed shapes:
 *   "1 pack (200 g)" "500 g" "200 - 300 g" "450 - 500 g" "1 pc (200 g)"
 *   "1 pack (10 x 10 g)" "1 pc (250 ml)" "1 pack (1 kg)" "900 g - 1 kg" "2.8 - 3 kg"
 *
 * Rules: "N x M unit" -> N*M; ranges/"or" -> lower value; mass (g/kg) preferred
 * over volume if both appear; no weight/volume found -> a count.
 */

export type PackKind = "mass" | "volume" | "count";

export interface PackSize {
  readonly kind: PackKind;
  readonly base: number; // grams (mass), millilitres (volume), or unit count
  readonly raw: string;
}

const UNIT = "(kg|g|mg|gm|gms|kgs|ml|l|ltr|litre|litres)";

function toBase(value: number, unit: string): { kind: PackKind; base: number } {
  switch (unit) {
    case "kg":
    case "kgs":
      return { kind: "mass", base: value * 1000 };
    case "g":
    case "gm":
    case "gms":
      return { kind: "mass", base: value };
    case "mg":
      return { kind: "mass", base: value / 1000 };
    case "l":
    case "ltr":
    case "litre":
    case "litres":
      return { kind: "volume", base: value * 1000 };
    default: // ml
      return { kind: "volume", base: value };
  }
}

export function parsePackSize(raw: string): PackSize {
  const s = raw.toLowerCase();

  const mult = s.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*[x×]\\s*(\\d+(?:\\.\\d+)?)\\s*${UNIT}`));
  if (mult) {
    const value = parseFloat(mult[1]!) * parseFloat(mult[2]!);
    return { ...toBase(value, mult[3]!), raw };
  }

  const candidates: Array<{ kind: PackKind; base: number }> = [];

  const shared = s.matchAll(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:-|to|or)\\s*(\\d+(?:\\.\\d+)?)\\s*${UNIT}`, "g"));
  for (const m of shared) {
    candidates.push(toBase(parseFloat(m[1]!), m[3]!));
    candidates.push(toBase(parseFloat(m[2]!), m[3]!));
  }

  const gen = s.matchAll(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${UNIT}\\b`, "g"));
  for (const m of gen) candidates.push(toBase(parseFloat(m[1]!), m[2]!));

  if (candidates.length > 0) {
    const masses = candidates.filter((c) => c.kind === "mass");
    const chosen = masses.length > 0 ? masses : candidates;
    const min = chosen.reduce((a, b) => (b.base < a.base ? b : a));
    return { kind: min.kind, base: min.base, raw };
  }

  const n = s.match(/(\d+)/);
  const count = n ? parseInt(n[1]!, 10) : 1;
  return { kind: "count", base: count > 0 ? count : 1, raw };
}

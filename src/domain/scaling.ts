/** Scale kitchen quantity strings like "1 3/4 cups" or "365 g" by a factor,
    keeping friendly fractions for display. */

const NUM_RE = /(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/;

function parseNum(tok: string): number {
  tok = tok.trim();
  if (/^\d+\s+\d+\/\d+$/.test(tok)) {
    const [whole, frac] = tok.split(/\s+/);
    const [n, d] = frac.split("/").map(Number);
    return parseInt(whole, 10) + n / d;
  }
  if (/^\d+\/\d+$/.test(tok)) {
    const [n, d] = tok.split("/").map(Number);
    return n / d;
  }
  return parseFloat(tok);
}

const FRACTIONS: Array<[number, string]> = [
  [0, ""],
  [1 / 8, "1/8"],
  [1 / 4, "1/4"],
  [1 / 3, "1/3"],
  [3 / 8, "3/8"],
  [1 / 2, "1/2"],
  [5 / 8, "5/8"],
  [2 / 3, "2/3"],
  [3 / 4, "3/4"],
  [7 / 8, "7/8"],
  [1, ""],
];

function toNice(value: number): string {
  if (value === 0) return "0";
  let whole = Math.floor(value + 1e-9);
  const frac = value - whole;
  let best = FRACTIONS[0];
  let bestD = Infinity;
  for (const cand of FRACTIONS) {
    const d = Math.abs(frac - cand[0]);
    if (d < bestD) {
      bestD = d;
      best = cand;
    }
  }
  if (best[0] === 1) {
    whole += 1;
    best = FRACTIONS[0];
  }
  const label = best[1];
  if (whole === 0 && label === "") return "0";
  if (whole === 0) return label;
  if (label === "") return String(whole);
  return `${whole} ${label}`;
}

export function scaleQtyText(str: string, factor: number): string {
  if (!str || factor === 1) return str;
  return str.replace(NUM_RE, (m) => toNice(parseNum(m) * factor));
}

const G_PER_LB = 453.592;
const G_PER_OZ = 28.3495;

export function formatWeight(grams: number): string {
  if (grams <= 0) return "0";
  if (grams >= G_PER_LB) return `${Math.round((grams / G_PER_LB) * 10) / 10} lb`;
  return `${Math.round((grams / G_PER_OZ) * 10) / 10} oz`;
}

export { G_PER_LB, G_PER_OZ };

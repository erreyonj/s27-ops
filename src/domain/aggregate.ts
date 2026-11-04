import type {
  AppData,
  BakerySettings,
  CategoryPackagingLine,
  GroceryLine,
  ItemComponent,
  MenuItem,
  PackagingSupply,
  RawIngredient,
} from "./types";

/** Batches of each component needed to produce the current menu.
    Menu quantity is how many batches to make; demand accumulates across
    menu items sharing a component, then rounds up once. */
export function componentBatches(data: AppData): Map<string, number> {
  const demand = new Map<string, number>();
  const itemById = new Map(data.menuItems.map((m) => [m.id, m]));
  const compById = new Map(data.components.map((c) => [c.id, c]));

  for (const entry of data.menu.entries) {
    if (entry.quantity <= 0) continue;
    const item = itemById.get(entry.menuItemId);
    if (!item) continue;
    for (const ref of item.components) {
      const comp = compById.get(ref.componentId);
      if (!comp) continue;
      const batches = entry.quantity * ref.scale;
      demand.set(ref.componentId, (demand.get(ref.componentId) ?? 0) + batches);
    }
  }

  const out = new Map<string, number>();
  for (const [id, frac] of demand) out.set(id, Math.ceil(frac - 1e-9));
  return out;
}

/** Aggregate raw ingredients across all needed component batches,
    applying per-ingredient rounding buffers/minimums. */
export function groceryLines(data: AppData): GroceryLine[] {
  const batches = componentBatches(data);
  const compById = new Map(data.components.map((c) => [c.id, c]));
  const ingById = new Map(data.ingredients.map((i) => [i.id, i]));

  const totals = new Map<string, number>(); // ingredientId -> base-unit qty
  for (const [compId, n] of batches) {
    if (n <= 0) continue;
    const comp = compById.get(compId);
    if (!comp) continue;
    for (const line of comp.lines) {
      const ing = ingById.get(line.ingredientId);
      if (!ing) continue;
      const per = lineQty(line, ing.baseUnit);
      if (per <= 0) continue;
      totals.set(line.ingredientId, (totals.get(line.ingredientId) ?? 0) + per * n);
    }
  }

  const lines: GroceryLine[] = [];
  for (const [id, needed] of totals) {
    const ingredient = ingById.get(id)!;
    let rounded = needed;
    let wasRounded = false;
    if (ingredient.roundTo && ingredient.roundTo > 0) {
      rounded = Math.ceil(needed / ingredient.roundTo) * ingredient.roundTo;
      wasRounded = rounded > needed;
    } else if (ingredient.baseUnit === "count" || ingredient.baseUnit === "tsp") {
      rounded = Math.ceil(needed);
      wasRounded = rounded > needed;
    }
    lines.push({ ingredient, needed, rounded, wasRounded });
  }

  lines.sort((a, b) => {
    const sa = a.ingredient.suggestedStore ?? "zz";
    const sb = b.ingredient.suggestedStore ?? "zz";
    if (sa !== sb) return sa.localeCompare(sb);
    return a.ingredient.name.localeCompare(b.ingredient.name);
  });
  return lines;
}

/** Group grocery lines by suggested store, preserving order. */
export function groupByStore(lines: GroceryLine[]): Array<{ store: string; lines: GroceryLine[] }> {
  const groups: Array<{ store: string; lines: GroceryLine[] }> = [];
  for (const line of lines) {
    const store = line.ingredient.suggestedStore ?? "Other";
    const last = groups[groups.length - 1];
    if (last && last.store === store) last.lines.push(line);
    else groups.push({ store, lines: [line] });
  }
  return groups;
}

/* ---------------- Pricing (Section C) ---------------- */

/** Qty of a component line in the ingredient's base unit. */
export function lineQty(
  line: { grams: number | null; count: number | null; tsp: number | null },
  baseUnit: RawIngredient["baseUnit"]
): number {
  if (baseUnit === "count") return line.count ?? 0;
  if (baseUnit === "tsp") return line.tsp ?? 0;
  return line.grams ?? 0;
}

const QTY_TEXT_RE =
  /^(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+)\s*(tbs|tbsp|tablespoons?|tsp|teaspoons?|g|grams?|ea|each|cups?)?\s*$/i;

/** Soft check: qtyText unit vs stored base-unit quantity (catches tbs→1 bugs). */
export function lineUnitMismatch(
  line: { qtyText: string; grams: number | null; count: number | null; tsp: number | null },
  baseUnit: RawIngredient["baseUnit"]
): string | null {
  const raw = (line.qtyText || "").trim();
  if (!raw) return null;
  const m = raw.match(QTY_TEXT_RE);
  if (!m) return null;
  const numTok = m[1];
  const unitTok = (m[2] || "").toLowerCase();
  let declared = 0;
  if (/^\d+\s+\d+\/\d+$/.test(numTok)) {
    const [w, f] = numTok.split(/\s+/);
    const [n, d] = f.split("/").map(Number);
    declared = parseInt(w, 10) + n / d;
  } else if (/^\d+\/\d+$/.test(numTok)) {
    const [n, d] = numTok.split("/").map(Number);
    declared = n / d;
  } else {
    declared = parseFloat(numTok);
  }
  if (!(declared > 0)) return null;

  const stored = lineQty(line, baseUnit);
  if (!(stored > 0)) return null;

  const isTbs = /^(tbs|tbsp|tablespoons?)$/.test(unitTok);
  if (isTbs && baseUnit === "tsp") {
    const expected = declared * 3;
    if (Math.abs(stored - expected) > 0.05 && Math.abs(stored - declared) < 0.05) {
      return `qtyText "${raw}" looks like tablespoons but stored tsp=${stored} (expected ~${expected})`;
    }
  }
  if (isTbs && baseUnit === "g") {
    if (stored <= declared + 0.05) {
      return `qtyText "${raw}" looks like tablespoons but stored grams=${stored}`;
    }
  }
  return null;
}

/** $ per base unit (per gram, count, or tsp), or null when unpriced. */
export function unitCost(ing: RawIngredient): number | null {
  if (ing.packPrice == null || ing.packQty == null || ing.packQty <= 0) return null;
  return ing.packPrice / ing.packQty;
}

export interface ComponentCost {
  component: ItemComponent;
  batchCost: number;
  perServing: number;
  missing: string[]; // ingredient names with no price
}

export function componentCost(
  comp: ItemComponent,
  ingById: Map<string, RawIngredient>
): ComponentCost {
  let batchCost = 0;
  const missing: string[] = [];
  for (const line of comp.lines) {
    const ing = ingById.get(line.ingredientId);
    if (!ing) continue;
    const qty = lineQty(line, ing.baseUnit);
    if (qty <= 0) continue;
    const cost = unitCost(ing);
    if (cost == null) {
      missing.push(ing.name);
      continue;
    }
    batchCost += qty * cost;
  }
  return {
    component: comp,
    batchCost,
    perServing: comp.yieldAmount > 0 ? batchCost / comp.yieldAmount : 0,
    missing,
  };
}

export interface MenuItemCost {
  item: MenuItem;
  /** Material cost for one menu-item batch (sum of linked component batch costs). */
  batchCost: number;
  parts: Array<{ name: string; batchCost: number }>;
  missing: string[];
}

export function menuItemCost(
  item: MenuItem,
  compById: Map<string, ItemComponent>,
  ingById: Map<string, RawIngredient>
): MenuItemCost {
  let batchCost = 0;
  const parts: Array<{ name: string; batchCost: number }> = [];
  const missing: string[] = [];
  for (const ref of item.components) {
    const comp = compById.get(ref.componentId);
    if (!comp) continue;
    const cost = componentCost(comp, ingById);
    const part = cost.batchCost * ref.scale;
    batchCost += part;
    parts.push({ name: comp.name, batchCost: part });
    missing.push(...cost.missing);
  }
  return { item, batchCost, parts, missing: [...new Set(missing)] };
}

/** Draft overrides for the live calculator (session UI until Commit). */
export interface QuoteDraft {
  laborHours: number | null;
  marginPct: number | null;
  discountPct: number | null;
}

export function packagingUnitCost(supply: PackagingSupply): number | null {
  if (supply.packPrice == null || supply.packQty == null || supply.packQty <= 0) return null;
  return supply.packPrice / supply.packQty;
}

export interface PackagingCost {
  /** Cost for one sellable unit's kit. */
  packCostPerUnit: number;
  /** Cost for the whole menu-item batch (× yieldAmount). */
  packaging: number;
  parts: Array<{ name: string; qty: number; unitCost: number; lineCost: number }>;
  missingSupplies: string[];
  kitMissing: boolean;
}

/** Category packaging kit × yieldAmount (every sellable unit gets a kit). */
export function packagingCostForItem(
  item: MenuItem,
  supplies: PackagingSupply[],
  categoryLines: CategoryPackagingLine[]
): PackagingCost {
  const yieldAmt = item.yieldAmount > 0 ? item.yieldAmount : 1;
  const supplyById = new Map(supplies.map((s) => [s.id, s]));
  const kit = categoryLines
    .filter((l) => l.category === item.category)
    .slice()
    .sort((a, b) => a.sort - b.sort);

  if (kit.length === 0) {
    return {
      packCostPerUnit: 0,
      packaging: 0,
      parts: [],
      missingSupplies: [],
      kitMissing: true,
    };
  }

  let packCostPerUnit = 0;
  const parts: PackagingCost["parts"] = [];
  const missingSupplies: string[] = [];

  for (const line of kit) {
    const supply = supplyById.get(line.supplyId);
    if (!supply) {
      missingSupplies.push(line.supplyId);
      continue;
    }
    const unit = packagingUnitCost(supply);
    if (unit == null) {
      missingSupplies.push(supply.name);
      continue;
    }
    const qty = line.qtyPerUnit * yieldAmt;
    const lineCost = unit * qty;
    packCostPerUnit += unit * line.qtyPerUnit;
    parts.push({
      name: supply.name,
      qty,
      unitCost: unit,
      lineCost,
    });
  }

  return {
    packCostPerUnit,
    packaging: packCostPerUnit * yieldAmt,
    parts,
    missingSupplies: [...new Set(missingSupplies)],
    kitMissing: false,
  };
}

export interface MenuItemQuote {
  item: MenuItem;
  materials: number;
  materialsParts: Array<{ name: string; batchCost: number }>;
  missingIngredients: string[];
  packaging: number;
  packCostPerUnit: number;
  packagingParts: PackagingCost["parts"];
  packagingKitMissing: boolean;
  missingPackaging: string[];
  laborHours: number | null;
  laborHoursMissing: boolean;
  labor: number;
  baseCost: number;
  effectiveMarginPct: number;
  marginInherited: boolean;
  marginZeroed: boolean;
  afterMargin: number;
  effectiveDiscountPct: number;
  discountInherited: boolean;
  discountZeroed: boolean;
  afterDiscount: number;
  taxPct: number;
  taxAmount: number;
  suggestedRetail: number;
  yieldAmount: number;
  displayUnit: string;
  warnings: string[];
}

/**
 * Excel Cake Builder–style quote for one batch:
 * materials + packaging + labor → / (1 - margin) → × (1 - discount) → × (1 + tax)
 */
export function quoteMenuItem(
  item: MenuItem,
  compById: Map<string, ItemComponent>,
  ingById: Map<string, RawIngredient>,
  settings: BakerySettings,
  draft?: QuoteDraft,
  packagingSupplies: PackagingSupply[] = [],
  categoryPackaging: CategoryPackagingLine[] = []
): MenuItemQuote {
  const mats = menuItemCost(item, compById, ingById);
  const yieldAmt = item.yieldAmount > 0 ? item.yieldAmount : 1;
  const materials = mats.batchCost;
  const pack = packagingCostForItem(item, packagingSupplies, categoryPackaging);

  const laborHours = draft ? draft.laborHours : item.laborHours;
  const laborHoursMissing = laborHours == null;
  const labor =
    laborHoursMissing || laborHours <= 0 ? 0 : laborHours * settings.hourlyRate;

  const marginRaw = draft ? draft.marginPct : item.marginPct;
  const marginInherited = marginRaw == null;
  const effectiveMarginPct = marginInherited ? settings.defaultMarginPct : marginRaw;
  const marginZeroed = !marginInherited && effectiveMarginPct === 0;

  const discountRaw = draft ? draft.discountPct : item.discountPct;
  const discountInherited = discountRaw == null;
  const effectiveDiscountPct = discountInherited
    ? settings.defaultDiscountPct
    : discountRaw;
  const discountZeroed = !discountInherited && effectiveDiscountPct === 0;

  const baseCost = materials + pack.packaging + labor;
  const afterMargin =
    effectiveMarginPct > 0 && effectiveMarginPct < 1
      ? baseCost / (1 - effectiveMarginPct)
      : baseCost;
  const afterDiscount = afterMargin * (1 - Math.min(Math.max(effectiveDiscountPct, 0), 1));
  const taxPct = settings.salesTaxPct;
  const suggestedRetail = afterDiscount * (1 + Math.max(taxPct, 0));
  const taxAmount = suggestedRetail - afterDiscount;

  const warnings: string[] = [];
  if (mats.missing.length) {
    warnings.push(`Missing ingredient prices: ${mats.missing.slice(0, 5).join(", ")}${mats.missing.length > 5 ? "…" : ""}`);
  }
  if (pack.kitMissing) {
    warnings.push(`No packaging kit for category "${item.category}"`);
  } else if (pack.missingSupplies.length) {
    warnings.push(
      `Missing packaging prices: ${pack.missingSupplies.slice(0, 5).join(", ")}${
        pack.missingSupplies.length > 5 ? "…" : ""
      }`
    );
  }
  if (laborHoursMissing) {
    warnings.push("Labor hours not set — labor treated as $0");
  } else if (laborHours === 0) {
    warnings.push("Labor hours zeroed for this item");
  }
  if (marginInherited) {
    warnings.push(
      `Using bakery default margin ${(settings.defaultMarginPct * 100).toFixed(0)}%`
    );
  } else if (marginZeroed) {
    warnings.push("Margin zeroed for this item");
  }
  if (discountInherited && settings.defaultDiscountPct > 0) {
    warnings.push(
      `Using bakery default discount ${(settings.defaultDiscountPct * 100).toFixed(0)}%`
    );
  } else if (discountZeroed) {
    warnings.push("Discount zeroed for this item");
  }
  if (taxPct === 0) {
    warnings.push("Sales tax is 0%");
  }

  const displayUnit = (item.yieldUnit || "batch").trim() || "batch";

  const unitMismatches: string[] = [];
  for (const ref of item.components) {
    const comp = compById.get(ref.componentId);
    if (!comp) continue;
    if (comp.yieldAmount <= 0) {
      warnings.push(`Component "${comp.name}" has yield 0`);
      continue;
    }
    for (const line of comp.lines) {
      const ing = ingById.get(line.ingredientId);
      if (!ing) continue;
      const mismatch = lineUnitMismatch(line, ing.baseUnit);
      if (mismatch) unitMismatches.push(`${comp.name}: ${ing.name}`);
    }
  }
  if (unitMismatches.length) {
    warnings.push(
      `Possible qty unit mismatch: ${unitMismatches.slice(0, 4).join("; ")}${
        unitMismatches.length > 4 ? "…" : ""
      }`
    );
  }

  return {
    item,
    materials,
    materialsParts: mats.parts.map((p) => ({
      name: p.name,
      batchCost: p.batchCost,
    })),
    missingIngredients: mats.missing,
    packaging: pack.packaging,
    packCostPerUnit: pack.packCostPerUnit,
    packagingParts: pack.parts,
    packagingKitMissing: pack.kitMissing,
    missingPackaging: pack.missingSupplies,
    laborHours,
    laborHoursMissing,
    labor,
    baseCost,
    effectiveMarginPct,
    marginInherited,
    marginZeroed,
    afterMargin,
    effectiveDiscountPct,
    discountInherited,
    discountZeroed,
    afterDiscount,
    taxPct,
    taxAmount,
    suggestedRetail,
    yieldAmount: yieldAmt,
    displayUnit,
    warnings,
  };
}

/** Retail label for one batch, e.g. "$7.80 for 6 cookies". */
export function formatRetailForBatch(
  amount: number,
  yieldAmount: number,
  yieldUnit: string
): string {
  const unit = yieldUnit.trim() || "batch";
  const n = yieldAmount > 0 ? yieldAmount : 1;
  return `$${amount.toFixed(2)} for ${n} ${unit}`;
}

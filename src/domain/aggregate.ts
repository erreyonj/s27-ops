import type {
  AppData,
  GroceryLine,
  ItemComponent,
  MenuItem,
  RawIngredient,
} from "./types";

/** Batches of each component needed to produce the current menu.
    Demand accumulates fractionally across menu items sharing a component
    (e.g. one buttercream covers several flavors), then rounds up once. */
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
      if (!comp || comp.yieldAmount <= 0) continue;
      const batches = (entry.quantity / comp.yieldAmount) * ref.scale;
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
      const per = ing.baseUnit === "count" ? line.count ?? 0 : line.grams ?? 0;
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
    } else if (ingredient.baseUnit === "count") {
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

/** $ per base unit (per gram or per count), or null when unpriced. */
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
    const qty = ing.baseUnit === "count" ? line.count ?? 0 : line.grams ?? 0;
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
  perUnit: number;
  parts: Array<{ name: string; perUnit: number }>;
  missing: string[];
}

export function menuItemCost(
  item: MenuItem,
  compById: Map<string, ItemComponent>,
  ingById: Map<string, RawIngredient>
): MenuItemCost {
  let perUnit = 0;
  const parts: Array<{ name: string; perUnit: number }> = [];
  const missing: string[] = [];
  for (const ref of item.components) {
    const comp = compById.get(ref.componentId);
    if (!comp) continue;
    const cost = componentCost(comp, ingById);
    const part = cost.perServing * ref.scale;
    perUnit += part;
    parts.push({ name: comp.name, perUnit: part });
    missing.push(...cost.missing);
  }
  return { item, perUnit, parts, missing: [...new Set(missing)] };
}

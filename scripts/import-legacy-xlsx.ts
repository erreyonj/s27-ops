/**
 * Import Legacy-Pricer-Inventory.xlsx into src/data/seed.ts + scripts/import-report.md.
 *
 * Usage: npm run import:legacy
 *
 * Requires the xlsx at repo root (gitignored). Uses cached formula values from Excel.
 */
import ExcelJS from "exceljs";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const XLSX = join(ROOT, "Legacy-Pricer-Inventory.xlsx");

const SKIP_SHEETS = new Set([
  "READ ME ",
  "TEMPLATE",
  "Materials",
  "Multi Product",
  "Cake Builder Data",
  "Cake Builder",
]);

/** Recipe material name → Materials sheet name. */
const NAME_ALIASES: Record<string, string> = {
  Vanilla: "Mexican Vanilla Extract",
  "Vanilla Extract": "Mexican Vanilla Extract",
  Salt: "Kosher Salt",
  "Vegetable Oil": "Vegetable Oil",
  "Dry Milk Powder": "Dry Milk Powder",
  "Pasteurized Egg Whites": "Pasteurized Egg Whites",
  Water: "Water",
  "White Vinegar": "White Distilled Vinegar",
  "White Distilled Vinegar": "White Distilled Vinegar",
  Oreos: "Oreos",
  "Hu Chocolate": "Hu Chocolate Gems",
  "Natural Peanut Butter": "Natural Peanut Butter",
  "Salted Butter": "Salted Butter",
  "Reese's Cups": "Reese's Cups",
  "Semi Sweet Chocolate Chips": "Semi-Sweet Chocolate Chips",
  "Semi-Sweet Chocolate Chips": "Semi-Sweet Chocolate Chips",
  Nutmeg: "Nutmeg",
  "Avocado Oil": "Avocado Oil",
};

type BaseUnit = "g" | "count" | "tsp";
type Category =
  | "cake"
  | "frosting"
  | "pie"
  | "dough"
  | "loaf"
  | "filling"
  | "topping"
  | "pudding"
  | "other"
  | "bars";

const SECONDARY_CATEGORIES = new Set<Category>(["frosting", "filling", "topping"]);

interface IngredientOut {
  id: string;
  name: string;
  category: string;
  baseUnit: BaseUnit;
  suggestedStore: string | null;
  packageSize: string | null;
  roundTo: number | null;
  roundLabel: string | null;
  packPrice: number | null;
  packQty: number | null;
  packQtyUnit: BaseUnit | null;
}

interface LineOut {
  ingredientId: string;
  qtyText: string;
  detail: string | null;
  grams: number | null;
  count: number | null;
  tsp: number | null;
  sort: number;
}

interface ComponentOut {
  id: string;
  name: string;
  category: Category;
  yieldAmount: number;
  yieldUnit: string;
  notes: string | null;
  lines: LineOut[];
  sheetName: string;
  excelBatchCost: number | null;
}

interface MenuItemOut {
  id: string;
  name: string;
  brandName: string;
  flavorTag: string | null;
  isPrimary: boolean;
  isPlaceholder: boolean;
  publishToSite: boolean;
  assemblyNotes: string | null;
  category: Category;
  yieldAmount: number;
  yieldUnit: string;
  laborHours: number | null;
  marginPct: number | null;
  discountPct: number | null;
  components: Array<{ componentId: string; scale: number; sort: number }>;
}

/** Pick product component (skip frosting/filling/topping when another exists). */
function productComponent(
  refs: MenuItemOut["components"],
  byId: Map<string, ComponentOut>
): ComponentOut | null {
  const comps = refs
    .slice()
    .sort((a, b) => a.sort - b.sort)
    .map((r) => byId.get(r.componentId))
    .filter((c): c is ComponentOut => !!c);
  if (!comps.length) return null;
  return comps.find((c) => !SECONDARY_CATEGORIES.has(c.category)) ?? comps[0];
}

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function cellVal(cell: ExcelJS.Cell | undefined): unknown {
  if (!cell) return null;
  const v = cell.value;
  if (v == null) return null;
  if (typeof v === "object" && v !== null && "result" in v) {
    const r = (v as ExcelJS.CellFormulaValue).result;
    return r == null ? null : r;
  }
  if (typeof v === "object" && v !== null && "richText" in v) {
    return (v as ExcelJS.CellRichTextValue).richText.map((t) => t.text).join("");
  }
  if (typeof v === "object" && v !== null && "text" in v) {
    return (v as { text: string }).text;
  }
  return v;
}

function asNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[$,]/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  if (typeof v === "object" && v !== null && "result" in v) {
    return asNumber((v as { result: unknown }).result);
  }
  return null;
}

function asString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t === "" ? null : t;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return null;
}

function isTablespoon(raw: string | null): boolean {
  if (!raw) return false;
  const u = raw.trim().toLowerCase();
  return u === "tbs" || u === "tbsp" || u === "tablespoon" || u === "tablespoons";
}

function normalizeUnit(raw: string | null): BaseUnit | null {
  if (!raw) return null;
  const u = raw.trim().toLowerCase();
  if (u === "g" || u === "grams" || u === "gram") return "g";
  if (u === "ea" || u === "each" || u === "count") return "count";
  if (u === "tsp" || u === "t" || u === "teaspoon" || u === "teaspoons") return "tsp";
  if (isTablespoon(raw)) return "tsp";
  return null;
}

/** Approximate grams per tablespoon for dry powders when Materials base is g. */
const G_PER_TBSP_POWDER = 7.5;

/**
 * Map recipe "# of Units" into the ingredient's Materials base unit.
 * Converts tablespoons → teaspoons (×3) or → grams (×7.5 for powders) when
 * the recipe unit is tbs/tbsp so cost and grocery amounts stay accurate.
 */
function qtyInBaseUnit(
  qty: number,
  recipeUnitRaw: string | null,
  baseUnit: BaseUnit
): { grams: number | null; count: number | null; tsp: number | null; warning?: string } {
  const recipeNorm = normalizeUnit(recipeUnitRaw);
  let warning: string | undefined;
  let amount = qty;

  if (isTablespoon(recipeUnitRaw)) {
    if (baseUnit === "tsp") {
      amount = qty * 3;
      warning = `converted ${qty} tbs → ${amount} tsp`;
    } else if (baseUnit === "g") {
      amount = qty * G_PER_TBSP_POWDER;
      warning = `converted ${qty} tbs → ${amount} g (≈${G_PER_TBSP_POWDER} g/tbsp)`;
    }
  } else if (recipeNorm && recipeNorm !== baseUnit) {
    warning = `recipe unit ${recipeUnitRaw} ≠ Materials ${baseUnit}; using qty as ${baseUnit}`;
  }

  if (baseUnit === "g") return { grams: amount, count: null, tsp: null, warning };
  if (baseUnit === "count") return { grams: null, count: amount, tsp: null, warning };
  return { grams: null, count: null, tsp: amount, warning };
}

/**
 * Component holds real per-batch yield (sellable units one batch covers).
 * Cupcakes → 12; Levain cookies → 6; cinnamon rolls → 8; etc.
 * Frostings/BCs → 1 batch; Cake Builder cakes/fillings → 1 cake.
 */
function componentYield(
  sheetName: string,
  category: Category,
  isCakeBuilderComp: boolean
): { amount: number; unit: string } {
  if (/Cupcake/i.test(sheetName)) return { amount: 12, unit: "cupcakes" };

  // Levain-style cookies (not sugar cookies / bars)
  if (
    /^(BB CC Cookies|CC Cookie|Double CC PB Cookies|OF PB Cookies)$/i.test(
      sheetName.trim()
    )
  ) {
    return { amount: 6, unit: "cookies" };
  }
  if (/Cinnamon Rolls/i.test(sheetName)) return { amount: 8, unit: "rolls" };
  if (/Banana Bread/i.test(sheetName)) return { amount: 8, unit: "slices" };
  if (/Sugar Cookie Bars/i.test(sheetName)) return { amount: 9, unit: "bars" };
  if (/Rice Crispy/i.test(sheetName)) return { amount: 12, unit: "treats" };
  if (/Pound Cake/i.test(sheetName)) return { amount: 16, unit: "slices" };

  if (category === "frosting") return { amount: 1, unit: "batch" };
  if (isCakeBuilderComp) return { amount: 1, unit: "cake" };
  if (category === "cake" || category === "filling") return { amount: 1, unit: "cake" };
  return { amount: 1, unit: "batch" };
}

function guessCategory(name: string, store: string | null): string {
  const n = name.toLowerCase();
  if (
    /flour|sugar|cocoa|starch|powder|soda|yeast|salt|spice|cinnamon|ginger|clove|nutmeg|cardamom|allspice/.test(
      n
    )
  )
    return "dry";
  if (/butter|cream|milk|cheese|egg|mascarpone|buttermilk|sour cream|yolk/.test(n)) return "dairy";
  if (/oil|vinegar|extract|vanilla|syrup|honey|water/.test(n)) return "wet";
  if (
    /berry|berries|lemon|apple|pear|banana|carrot|pineapple|strawberry|raspberry|blackberry/.test(n)
  )
    return "produce";
  if (/chocolate|oreo|cookie|biscoff|marshmallow|candy|chip|wafer|graham/.test(n)) return "flavor";
  if (store === "Pantry" || n === "water") return "pantry";
  return "other";
}

function classifyCategory(
  sheetName: string,
  cakeBases: Set<string>,
  frostings: Set<string>,
  fillings: Set<string>
): Category {
  const n = sheetName.trim();
  if (cakeBases.has(n)) return "cake";
  if (frostings.has(n)) return "frosting";
  if (fillings.has(n)) return "filling";
  if (
    /\bBC\b|SMBC|Buttercream|Frosting|Ganache|Chantilly|Mousse/i.test(n) &&
    !/Cupcake|Cake\b/i.test(n)
  )
    return "frosting";
  if (/Filling|Curd|Sauce/i.test(n)) return "filling";
  if (/Cupcake|Cake\b/i.test(n)) return "cake";
  if (/Pie\b/i.test(n)) return "pie";
  if (/Pudding/i.test(n)) return "pudding";
  if (/Bars?\b/i.test(n)) return "bars";
  if (/Loaf|Bread/i.test(n)) return "loaf";
  if (/Dough|Cookie|Roll/i.test(n)) return "dough";
  return "other";
}

function isProductSheet(sheetName: string, cakeComponentNames: Set<string>): boolean {
  const n = sheetName.trim();
  if (/Cupcake/i.test(n)) return true;
  if (cakeComponentNames.has(n)) return false;
  return /Cookie|Pie|Cinnamon|Brownie|Bread|Bar|Treat|Pudding|Pound Cake|Sugar Cookie/i.test(n);
}

function tsLiteral(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  throw new Error(`unsupported literal ${typeof v}`);
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX);

  const materials = wb.getWorksheet("Materials");
  if (!materials) throw new Error("Materials sheet missing");

  const cakeData = wb.getWorksheet("Cake Builder Data");
  if (!cakeData) throw new Error("Cake Builder Data sheet missing");

  const ingredients: IngredientOut[] = [];
  const byNormName = new Map<string, IngredientOut>();
  const byExactName = new Map<string, IngredientOut>();

  materials.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const name = asString(cellVal(row.getCell(1)));
    if (!name) return;
    const packPrice = asNumber(cellVal(row.getCell(3)));
    const unitRaw = asString(cellVal(row.getCell(4)));
    const packQty = asNumber(cellVal(row.getCell(5)));
    const store = asString(cellVal(row.getCell(8)));
    let baseUnit = normalizeUnit(unitRaw);
    if (!baseUnit) baseUnit = "g";
    // Materials sheet typos: Salted Butter is listed as ea/454 but recipes use grams
    // (same pack as Unsalted Butter).
    if (/^salted butter$/i.test(name) && baseUnit === "count" && packQty != null && packQty > 50) {
      baseUnit = "g";
    }

    const id = slugify(name);
    const ing: IngredientOut = {
      id,
      name,
      category: guessCategory(name, store),
      baseUnit,
      suggestedStore: store,
      packageSize: packQty != null && unitRaw ? `${packQty} ${unitRaw}` : null,
      roundTo: null,
      roundLabel: null,
      packPrice,
      packQty,
      packQtyUnit: baseUnit,
    };
    if (/^eggs$/i.test(name)) {
      ing.roundTo = 12;
      ing.roundLabel = "dozen";
    } else if (baseUnit === "count") {
      ing.roundTo = 1;
    }
    if (/butter/i.test(name) && baseUnit === "g") {
      ing.roundTo = 453.592;
      ing.roundLabel = "1 lb blocks";
    }
    ingredients.push(ing);
    byExactName.set(name, ing);
    byNormName.set(name.toLowerCase(), ing);
  });

  if (!byNormName.has("water")) {
    const water: IngredientOut = {
      id: "water",
      name: "Water",
      category: "pantry",
      baseUnit: "g",
      suggestedStore: "Pantry",
      packageSize: "tap",
      roundTo: null,
      roundLabel: null,
      packPrice: 0,
      packQty: 1,
      packQtyUnit: "g",
    };
    ingredients.push(water);
    byExactName.set("Water", water);
    byNormName.set("water", water);
  }

  function resolveIngredient(recipeName: string): IngredientOut | null {
    const aliased = NAME_ALIASES[recipeName] ?? recipeName;
    return (
      byExactName.get(aliased) ??
      byNormName.get(aliased.toLowerCase()) ??
      byExactName.get(recipeName) ??
      byNormName.get(recipeName.toLowerCase()) ??
      null
    );
  }

  const cakeBases = new Set<string>();
  const frostings = new Set<string>();
  const fillings = new Set<string>();
  const componentRegistry = new Map<string, string>();
  const combos: Array<{
    name: string;
    cake: string;
    frosting: string;
    filling1: string | null;
    filling2: string | null;
  }> = [];

  cakeData.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const a = asString(cellVal(row.getCell(1)));
    const b = asString(cellVal(row.getCell(2)));
    const c = asString(cellVal(row.getCell(3)));
    const d = asString(cellVal(row.getCell(4)));
    const e = asString(cellVal(row.getCell(5)));

    if (rowNumber >= 21 && a && b && a !== "ComponentName") {
      componentRegistry.set(a, b);
      return;
    }

    if (rowNumber >= 2 && rowNumber <= 17 && a && b && a !== "ComponentName") {
      combos.push({
        name: a,
        cake: b,
        frosting: c ?? "",
        filling1: d,
        filling2: e,
      });
    }
  });

  for (let r = 2; r <= 15; r++) {
    const g = asString(cellVal(cakeData.getRow(r).getCell(7)));
    const h = asString(cellVal(cakeData.getRow(r).getCell(8)));
    const i = asString(cellVal(cakeData.getRow(r).getCell(9)));
    if (g && g !== "Clear") cakeBases.add(g);
    if (h && h !== "Clear") frostings.add(h);
    if (i && i !== "Clear") fillings.add(i);
  }
  for (const combo of combos) {
    if (combo.cake) cakeBases.add(combo.cake);
    if (combo.frosting) frostings.add(combo.frosting);
    if (combo.filling1) fillings.add(combo.filling1);
    if (combo.filling2) fillings.add(combo.filling2);
  }
  for (const [name] of componentRegistry) {
    if (frostings.has(name) || /BC|SMBC|Chantilly Cream|Ganache|Mousse/i.test(name))
      frostings.add(name);
    else if (fillings.has(name) || /Filling|Curd|Layer/i.test(name)) fillings.add(name);
    else if (cakeBases.has(name) || /Cake|Velvet|Funfetti/i.test(name)) cakeBases.add(name);
  }

  const cakeComponentNames = new Set([...componentRegistry.keys()]);

  const unmatched = new Map<string, { sheets: Set<string>; count: number }>();
  const unitWarnings: string[] = [];
  const yieldNotes: string[] = [];
  const components: ComponentOut[] = [];
  const sheetToComponentId = new Map<string, string>();

  for (const ws of wb.worksheets) {
    const sheetName = ws.name;
    if (SKIP_SHEETS.has(sheetName)) continue;

    const lines: LineOut[] = [];
    let sort = 0;
    for (let r = 20; r <= 70; r++) {
      const row = ws.getRow(r);
      const matName = asString(cellVal(row.getCell(2)));
      if (!matName) continue;
      const qty = asNumber(cellVal(row.getCell(3)));
      const unitRaw = asString(cellVal(row.getCell(5)));
      if (qty == null || qty === 0) continue;

      const ing = resolveIngredient(matName);
      if (!ing) {
        const entry = unmatched.get(matName) ?? { sheets: new Set(), count: 0 };
        entry.sheets.add(sheetName);
        entry.count += 1;
        unmatched.set(matName, entry);
        continue;
      }

      const converted = qtyInBaseUnit(qty, unitRaw, ing.baseUnit);
      if (converted.warning) {
        unitWarnings.push(`${sheetName}: ${matName} (${converted.warning})`);
      }

      const qtyText = unitRaw != null ? `${qty} ${unitRaw}` : String(qty);

      lines.push({
        ingredientId: ing.id,
        qtyText,
        detail: null,
        grams: converted.grams,
        count: converted.count,
        tsp: converted.tsp,
        sort: sort++,
      });
    }

    const category = classifyCategory(sheetName, cakeBases, frostings, fillings);
    const isCakeBuilderComp =
      cakeComponentNames.has(sheetName.trim()) ||
      cakeBases.has(sheetName.trim()) ||
      frostings.has(sheetName.trim()) ||
      fillings.has(sheetName.trim());
    const { amount: yieldAmount, unit: yieldUnit } = componentYield(
      sheetName,
      category,
      isCakeBuilderComp
    );
    yieldNotes.push(`${sheetName}: yield ${yieldAmount} ${yieldUnit}`);

    // Legacy Excel often listed baking powder as a second "baking soda" row.
    for (let i = 1; i < lines.length; i++) {
      const prev = lines[i - 1];
      const cur = lines[i];
      if (
        cur.ingredientId === "baking-soda" &&
        prev.ingredientId === "baking-soda" &&
        cur.tsp === prev.tsp
      ) {
        cur.ingredientId = "baking-powder";
        unitWarnings.push(
          `${sheetName}: remapped duplicate baking-soda → baking-powder`
        );
      }
    }

    const excelBatchCost = asNumber(cellVal(ws.getRow(9).getCell(9)));
    const id = `comp-${slugify(sheetName)}`;
    const displayName = sheetName.trim();

    components.push({
      id,
      name: displayName,
      category,
      yieldAmount,
      yieldUnit,
      notes:
        excelBatchCost != null
          ? `Legacy Excel batch material cost ≈ $${excelBatchCost.toFixed(2)}`
          : null,
      lines,
      sheetName,
      excelBatchCost,
    });
    sheetToComponentId.set(sheetName, id);
    sheetToComponentId.set(sheetName.trim(), id);
  }

  const nameToComponentId = new Map<string, string>();
  for (const [compName, sheet] of componentRegistry) {
    const id = sheetToComponentId.get(sheet) ?? sheetToComponentId.get(sheet.trim());
    if (id) nameToComponentId.set(compName, id);
  }
  for (const c of components) {
    nameToComponentId.set(c.name, c.id);
    nameToComponentId.set(c.sheetName, c.id);
    nameToComponentId.set(c.sheetName.trim(), c.id);
  }

  const menuItems: MenuItemOut[] = [];
  const missingComboParts: string[] = [];
  const compById = new Map(components.map((c) => [c.id, c]));

  for (const combo of combos) {
    const refs: MenuItemOut["components"] = [];
    const parts = [
      { role: "cake", name: combo.cake },
      { role: "frosting", name: combo.frosting },
      { role: "filling1", name: combo.filling1 },
      { role: "filling2", name: combo.filling2 },
    ];
    let sort = 0;
    for (const p of parts) {
      if (!p.name || p.name === "Clear") continue;
      const cid = nameToComponentId.get(p.name);
      if (!cid) {
        missingComboParts.push(`${combo.name}: missing ${p.role} "${p.name}"`);
        continue;
      }
      refs.push({ componentId: cid, scale: 1, sort: sort++ });
    }
    const product = productComponent(refs, compById);
    menuItems.push({
      id: `mi-${slugify(combo.name)}`,
      name: combo.name,
      brandName: combo.name,
      flavorTag: slugify(combo.name),
      isPrimary: false,
      isPlaceholder: false,
      publishToSite: false,
      assemblyNotes: [combo.cake, combo.frosting, combo.filling1, combo.filling2]
        .filter((x) => x && x !== "Clear")
        .join(" + "),
      category: product?.category ?? "cake",
      yieldAmount: product?.yieldAmount ?? 1,
      yieldUnit: product?.yieldUnit ?? "cake",
      laborHours: null,
      marginPct: null,
      discountPct: null,
      components: refs,
    });
  }

  for (const c of components) {
    if (!isProductSheet(c.sheetName, cakeComponentNames)) continue;
    if (menuItems.some((m) => m.name === c.name)) continue;
    const isCupcake = /Cupcake/i.test(c.sheetName);
    menuItems.push({
      id: `mi-${slugify(c.name)}`,
      name: c.name,
      brandName: c.name,
      flavorTag: slugify(c.name),
      isPrimary: isCupcake,
      isPlaceholder: false,
      publishToSite: false,
      assemblyNotes: null,
      category: c.category,
      yieldAmount: c.yieldAmount,
      yieldUnit: c.yieldUnit,
      laborHours: null,
      marginPct: null,
      discountPct: null,
      components: [{ componentId: c.id, scale: 1, sort: 0 }],
    });
  }

  const seedPath = join(ROOT, "src/data/seed.ts");
  const linesOut: string[] = [];
  linesOut.push(`/* AUTO-GENERATED by scripts/import-legacy-xlsx.ts — do not edit by hand.
   Re-run: npm run import:legacy
   Source: Legacy-Pricer-Inventory.xlsx */`);
  linesOut.push(`import type {`);
  linesOut.push(`  ItemComponent,`);
  linesOut.push(`  MenuItem,`);
  linesOut.push(`  RawIngredient,`);
  linesOut.push(`} from "../domain/types";`);
  linesOut.push(``);
  linesOut.push(`export const seedIngredients: RawIngredient[] = [`);
  for (const i of ingredients) {
    linesOut.push(
      `  { id: ${tsLiteral(i.id)}, name: ${tsLiteral(i.name)}, category: ${tsLiteral(i.category)}, baseUnit: ${tsLiteral(i.baseUnit)}, suggestedStore: ${tsLiteral(i.suggestedStore)}, packageSize: ${tsLiteral(i.packageSize)}, roundTo: ${tsLiteral(i.roundTo)}, roundLabel: ${tsLiteral(i.roundLabel)}, packPrice: ${tsLiteral(i.packPrice)}, packQty: ${tsLiteral(i.packQty)}, packQtyUnit: ${tsLiteral(i.packQtyUnit)} },`
    );
  }
  linesOut.push(`];`);
  linesOut.push(``);
  linesOut.push(`export const seedComponents: ItemComponent[] = [`);
  for (const c of components) {
    linesOut.push(`  {`);
    linesOut.push(`    id: ${tsLiteral(c.id)},`);
    linesOut.push(`    name: ${tsLiteral(c.name)},`);
    linesOut.push(`    category: ${tsLiteral(c.category)},`);
    linesOut.push(`    yieldAmount: ${c.yieldAmount},`);
    linesOut.push(`    yieldUnit: ${tsLiteral(c.yieldUnit)},`);
    linesOut.push(`    notes: ${tsLiteral(c.notes)},`);
    linesOut.push(`    lines: [`);
    for (const l of c.lines) {
      linesOut.push(
        `      { ingredientId: ${tsLiteral(l.ingredientId)}, qtyText: ${tsLiteral(l.qtyText)}, detail: ${tsLiteral(l.detail)}, grams: ${tsLiteral(l.grams)}, count: ${tsLiteral(l.count)}, tsp: ${tsLiteral(l.tsp)}, sort: ${l.sort} },`
      );
    }
    linesOut.push(`    ],`);
    linesOut.push(`  },`);
  }
  linesOut.push(`];`);
  linesOut.push(``);
  linesOut.push(`export const seedMenuItems: MenuItem[] = [`);
  for (const m of menuItems) {
    linesOut.push(`  {`);
    linesOut.push(`    id: ${tsLiteral(m.id)},`);
    linesOut.push(`    name: ${tsLiteral(m.name)},`);
    linesOut.push(`    brandName: ${tsLiteral(m.brandName)},`);
    linesOut.push(`    flavorTag: ${tsLiteral(m.flavorTag)},`);
    linesOut.push(`    isPrimary: ${m.isPrimary},`);
    linesOut.push(`    isPlaceholder: ${m.isPlaceholder},`);
    linesOut.push(`    publishToSite: ${m.publishToSite},`);
    linesOut.push(`    assemblyNotes: ${tsLiteral(m.assemblyNotes)},`);
    linesOut.push(`    category: ${tsLiteral(m.category)},`);
    linesOut.push(`    yieldAmount: ${m.yieldAmount},`);
    linesOut.push(`    yieldUnit: ${tsLiteral(m.yieldUnit)},`);
    linesOut.push(`    laborHours: ${tsLiteral(m.laborHours)},`);
    linesOut.push(`    marginPct: ${tsLiteral(m.marginPct)},`);
    linesOut.push(`    discountPct: ${tsLiteral(m.discountPct)},`);
    linesOut.push(`    components: [`);
    for (const ref of m.components) {
      linesOut.push(
        `      { componentId: ${tsLiteral(ref.componentId)}, scale: ${ref.scale}, sort: ${ref.sort} },`
      );
    }
    linesOut.push(`    ],`);
    linesOut.push(`  },`);
  }
  linesOut.push(`];`);
  linesOut.push(``);

  writeFileSync(seedPath, linesOut.join("\n"));

  const ingById = new Map(ingredients.map((i) => [i.id, i]));
  function batchCost(comp: ComponentOut): { cost: number; missing: string[] } {
    let cost = 0;
    const missing: string[] = [];
    for (const line of comp.lines) {
      const ing = ingById.get(line.ingredientId);
      if (!ing || ing.packPrice == null || ing.packQty == null || ing.packQty <= 0) {
        missing.push(line.ingredientId);
        continue;
      }
      const qty =
        ing.baseUnit === "count"
          ? (line.count ?? 0)
          : ing.baseUnit === "tsp"
            ? (line.tsp ?? 0)
            : (line.grams ?? 0);
      cost += qty * (ing.packPrice / ing.packQty);
    }
    return { cost, missing };
  }

  const checks: string[] = [];
  for (const name of ["Chocolate Cupcakes", "SMBC", "Black Velvet", "Ganache"]) {
    const c = components.find((x) => x.sheetName.trim() === name || x.name === name);
    if (!c) {
      checks.push(`- ${name}: NOT FOUND`);
      continue;
    }
    const { cost, missing } = batchCost(c);
    const excel = c.excelBatchCost;
    const delta = excel != null ? Math.abs(cost - excel) : null;
    checks.push(
      `- ${name}: computed $${cost.toFixed(2)} vs Excel $${excel?.toFixed(2) ?? "?"} Δ=${delta?.toFixed(4) ?? "?"} missing=${missing.length ? missing.join(",") : "none"}`
    );
  }
  const nyla = menuItems.find((m) => m.name === "Nyla");
  if (nyla) {
    let total = 0;
    for (const ref of nyla.components) {
      const c = components.find((x) => x.id === ref.componentId);
      if (!c) continue;
      total += batchCost(c).cost;
    }
    checks.push(`- Nyla (menu): computed $${total.toFixed(2)} (Black Velvet + SMBC + Ganache)`);
  }

  const report: string[] = [];
  report.push(`# Legacy import report`);
  report.push(``);
  report.push(`Generated by \`npm run import:legacy\`.`);
  report.push(``);
  report.push(`## Counts`);
  report.push(`- Ingredients: ${ingredients.length}`);
  report.push(`- Components: ${components.length}`);
  report.push(`- Menu items: ${menuItems.length}`);
  report.push(`- Cake Builder combos: ${combos.length}`);
  report.push(``);
  report.push(`## Cost spot-checks`);
  report.push(...checks);
  report.push(``);
  report.push(`## Unmatched recipe materials`);
  if (unmatched.size === 0) report.push(`- (none)`);
  else {
    for (const [name, info] of [...unmatched.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      report.push(`- **${name}** ×${info.count} on: ${[...info.sheets].join(", ")}`);
    }
  }
  report.push(``);
  report.push(`## Missing Cake Builder parts`);
  if (missingComboParts.length === 0) report.push(`- (none)`);
  else for (const m of missingComboParts) report.push(`- ${m}`);
  report.push(``);
  report.push(`## Unit warnings`);
  if (unitWarnings.length === 0) report.push(`- (none)`);
  else for (const w of unitWarnings.slice(0, 80)) report.push(`- ${w}`);
  if (unitWarnings.length > 80) report.push(`- … ${unitWarnings.length - 80} more`);
  report.push(``);
  report.push(`## Yield defaults applied`);
  for (const y of yieldNotes) report.push(`- ${y}`);
  report.push(``);

  const reportPath = join(ROOT, "scripts/import-report.md");
  writeFileSync(reportPath, report.join("\n"));

  console.log(`Wrote ${seedPath}`);
  console.log(`Wrote ${reportPath}`);
  console.log(
    `Ingredients=${ingredients.length} components=${components.length} menuItems=${menuItems.length}`
  );
  console.log(`Unmatched materials: ${unmatched.size}`);
  for (const c of checks) console.log(c);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

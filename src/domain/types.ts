export type BaseUnit = "g" | "count" | "tsp";

export interface RawIngredient {
  id: string;
  name: string;
  category: string;
  baseUnit: BaseUnit;
  suggestedStore: string | null;
  packageSize: string | null;
  /** Round grocery purchases up to a multiple of this (in baseUnit). */
  roundTo: number | null;
  roundLabel: string | null;
  /** Pricing: cost of one purchased pack and its contents. */
  packPrice: number | null;
  packQty: number | null;
  packQtyUnit: BaseUnit | null;
}

export interface ComponentLine {
  id?: number;
  ingredientId: string;
  qtyText: string;
  detail: string | null;
  grams: number | null;
  count: number | null;
  /** Teaspoons per batch (for tsp-priced spices/extracts). */
  tsp: number | null;
  sort: number;
}

/** Matches public.category enum in Supabase. */
export type Category =
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

export const CATEGORIES: Category[] = [
  "cake",
  "frosting",
  "pie",
  "dough",
  "loaf",
  "filling",
  "topping",
  "pudding",
  "other",
  "bars",
];

/** Roles that are never the "product" component for yield/category inheritance. */
export const SECONDARY_CATEGORIES: ReadonlySet<Category> = new Set([
  "frosting",
  "filling",
  "topping",
]);

export interface ItemComponent {
  id: string;
  name: string;
  category: Category;
  /** Units one batch covers (12 cupcakes, 6 cookies, frosts 1 cake...). */
  yieldAmount: number;
  yieldUnit: string;
  notes: string | null;
  lines: ComponentLine[];
}

export interface MenuItemComponentRef {
  componentId: string;
  scale: number;
  sort: number;
}

export interface MenuItem {
  id: string;
  name: string;
  /** Customer-facing label (packaging, farmers market). Defaults to name. */
  brandName: string;
  flavorTag: string | null;
  isPrimary: boolean;
  isPlaceholder: boolean;
  /** When true, brand name (+ flavor) appears on the public farmers market page. */
  publishToSite: boolean;
  assemblyNotes: string | null;
  category: Category;
  /** Units one batch of this menu item yields (matches product component). */
  yieldAmount: number;
  /** Display unit for the batch, e.g. cookies | cake | cupcakes. */
  yieldUnit: string;
  /** Labor hours for one batch; null = not set (warn, treat as $0). */
  laborHours: number | null;
  /** null = inherit bakery default; 0 = intentionally zeroed. */
  marginPct: number | null;
  /** null = inherit bakery default; 0 = intentionally zeroed. */
  discountPct: number | null;
  components: MenuItemComponentRef[];
}

export interface BakerySettings {
  id: string;
  hourlyRate: number;
  salesTaxPct: number;
  defaultMarginPct: number;
  defaultDiscountPct: number;
  /** Venmo / card pass-through fee rate (e.g. 0.0229 = 2.29%). */
  venmoFeePct: number;
  /** Venmo / card pass-through fixed fee in dollars (e.g. 0.09). */
  venmoFeeFixed: number;
}

/** Purchased packaging SKU (bag, box, label roll). */
export interface PackagingSupply {
  id: string;
  name: string;
  packPrice: number | null;
  packQty: number | null;
  notes: string | null;
}

/** One line in a category packaging kit (qty per sellable unit). */
export interface CategoryPackagingLine {
  category: Category;
  supplyId: string;
  qtyPerUnit: number;
  sort: number;
}

export interface MenuEntry {
  menuItemId: string;
  quantity: number;
}

export interface CurrentMenu {
  id: string;
  weekOf: string | null;
  entries: MenuEntry[];
}

export interface AppData {
  ingredients: RawIngredient[];
  components: ItemComponent[];
  menuItems: MenuItem[];
  menu: CurrentMenu;
  settings: BakerySettings;
  packagingSupplies: PackagingSupply[];
  categoryPackaging: CategoryPackagingLine[];
}

export const DEFAULT_BAKERY_SETTINGS: BakerySettings = {
  id: "default",
  hourlyRate: 20,
  salesTaxPct: 0,
  defaultMarginPct: 0.35,
  defaultDiscountPct: 0,
  venmoFeePct: 0.0229,
  venmoFeeFixed: 0.09,
};

/** Aggregated grocery output. */
export interface GroceryLine {
  ingredient: RawIngredient;
  /** Exact need in the ingredient's base unit. */
  needed: number;
  /** Need after rounding buffers/minimums. */
  rounded: number;
  /** True when a rounding rule bumped the quantity. */
  wasRounded: boolean;
}

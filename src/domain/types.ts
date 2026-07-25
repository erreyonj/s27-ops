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

export type ComponentType =
  | "cake"
  | "frosting"
  | "filling"
  | "topping"
  | "dough"
  | "other";

export interface ItemComponent {
  id: string;
  name: string;
  type: ComponentType;
  /** Servings one batch covers (12 cupcakes, frosts 36, fills 30...). */
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
  flavorTag: string | null;
  isPrimary: boolean;
  isPlaceholder: boolean;
  assemblyNotes: string | null;
  /** How many sellable units one composed item represents (usually 1). */
  yieldAmount: number;
  /** Display unit for retail, e.g. cake | cupcake | batch. */
  yieldUnit: string;
  /** Labor hours for one yield unit; null = not set (warn, treat as $0). */
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
}

export const DEFAULT_BAKERY_SETTINGS: BakerySettings = {
  id: "default",
  hourlyRate: 20,
  salesTaxPct: 0,
  defaultMarginPct: 0.35,
  defaultDiscountPct: 0,
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

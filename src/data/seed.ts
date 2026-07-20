/* Seed data migrated from production-site-v1 (data/recipes.js), decomposed into
   RawIngredient -> ItemComponent -> MenuItem. Used by scripts/seed.ts (Supabase)
   and by the in-browser demo repository when Supabase isn't configured yet. */
import type {
  ItemComponent,
  MenuItem,
  RawIngredient,
} from "../domain/types";

const LB = 453.592;

export const seedIngredients: RawIngredient[] = [
  { id: "cake-flour", name: "Cake flour", category: "dry", baseUnit: "g", suggestedStore: "Restaurant Depot", packageSize: "25 lb bag", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "ap-flour", name: "All-purpose flour", category: "dry", baseUnit: "g", suggestedStore: "Restaurant Depot", packageSize: "25-50 lb bag", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "granulated-sugar", name: "Granulated sugar", category: "dry", baseUnit: "g", suggestedStore: "Restaurant Depot", packageSize: "25 lb bag", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "brown-sugar", name: "Brown sugar", category: "dry", baseUnit: "g", suggestedStore: "Restaurant Depot", packageSize: "25 lb bag", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "powdered-sugar", name: "Powdered sugar", category: "dry", baseUnit: "g", suggestedStore: "Restaurant Depot", packageSize: "25 lb bag", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "cocoa", name: "Dutch cocoa powder", category: "dry", baseUnit: "g", suggestedStore: "Restaurant Depot", packageSize: "bag", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "butter", name: "Unsalted butter", category: "dairy", baseUnit: "g", suggestedStore: "Costco", packageSize: "1 lb blocks", roundTo: LB, roundLabel: "1 lb blocks", packPrice: null, packQty: null, packQtyUnit: null },
  { id: "veg-oil", name: "Vegetable / neutral oil", category: "wet", baseUnit: "g", suggestedStore: "Restaurant Depot", packageSize: "1 gal jug", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "eggs", name: "Large eggs", category: "dairy", baseUnit: "count", suggestedStore: "Costco", packageSize: "flat (2.5 doz)", roundTo: 12, roundLabel: "dozen", packPrice: null, packQty: null, packQtyUnit: null },
  { id: "egg-yolks", name: "Egg yolks (from large eggs)", category: "dairy", baseUnit: "count", suggestedStore: "Costco", packageSize: "from large eggs", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "egg-whites", name: "Pasteurized egg whites", category: "dairy", baseUnit: "g", suggestedStore: "Restaurant Depot", packageSize: "carton", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "sour-cream", name: "Sour cream", category: "dairy", baseUnit: "g", suggestedStore: "Costco", packageSize: "tub", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "heavy-cream", name: "Heavy cream", category: "dairy", baseUnit: "g", suggestedStore: "Costco", packageSize: "1/2 gal", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "whipping-cream", name: "Whipping cream", category: "dairy", baseUnit: "g", suggestedStore: "Costco", packageSize: "1/2 gal", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "buttermilk", name: "Buttermilk", category: "dairy", baseUnit: "g", suggestedStore: "Walmart", packageSize: "quart", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "mascarpone", name: "Mascarpone", category: "dairy", baseUnit: "g", suggestedStore: "Walmart", packageSize: "8 oz tub", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "milk-powder", name: "Nonfat milk powder", category: "dry", baseUnit: "g", suggestedStore: "Walmart", packageSize: "box", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "vanilla-paste", name: "Vanilla bean paste", category: "flavor", baseUnit: "g", suggestedStore: "Costco", packageSize: "jar", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "vanilla-extract", name: "Vanilla extract", category: "flavor", baseUnit: "g", suggestedStore: "Costco", packageSize: "bottle", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "espresso", name: "Espresso powder", category: "flavor", baseUnit: "g", suggestedStore: "Walmart", packageSize: "jar", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "instant-coffee", name: "Instant coffee", category: "flavor", baseUnit: "g", suggestedStore: "Walmart", packageSize: "jar", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "baking-powder", name: "Baking powder", category: "dry", baseUnit: "g", suggestedStore: "Walmart", packageSize: "can", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "baking-soda", name: "Baking soda", category: "dry", baseUnit: "g", suggestedStore: "Walmart", packageSize: "box", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "salt", name: "Salt", category: "dry", baseUnit: "g", suggestedStore: "Walmart", packageSize: "box", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "cornstarch", name: "Cornstarch", category: "dry", baseUnit: "g", suggestedStore: "Walmart", packageSize: "box", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "vinegar", name: "White distilled vinegar", category: "wet", baseUnit: "g", suggestedStore: "Walmart", packageSize: "bottle", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "lemons", name: "Lemons", category: "produce", baseUnit: "count", suggestedStore: "Walmart", packageSize: "bag", roundTo: 1, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "frozen-strawberries", name: "Frozen strawberries", category: "produce", baseUnit: "g", suggestedStore: "Costco", packageSize: "bag", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "freeze-dried-strawberries", name: "Freeze-dried strawberries", category: "flavor", baseUnit: "g", suggestedStore: "Walmart", packageSize: "bag", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "chocolate-chunks", name: "Chocolate chunks / chips", category: "flavor", baseUnit: "g", suggestedStore: "Costco", packageSize: "bag", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
  { id: "oreos", name: "Oreos", category: "flavor", baseUnit: "count", suggestedStore: "Walmart", packageSize: "family pack (36)", roundTo: 36, roundLabel: "family pack", packPrice: null, packQty: null, packQtyUnit: null },
  { id: "water", name: "Water", category: "pantry", baseUnit: "g", suggestedStore: "Pantry", packageSize: "tap", roundTo: null, roundLabel: null, packPrice: null, packQty: null, packQtyUnit: null },
];

let sortCounter = 0;
function line(
  ingredientId: string,
  qtyText: string,
  opts: { detail?: string; grams?: number; count?: number } = {}
) {
  return {
    ingredientId,
    qtyText,
    detail: opts.detail ?? null,
    grams: opts.grams ?? null,
    count: opts.count ?? null,
    sort: sortCounter++,
  };
}

export const seedComponents: ItemComponent[] = [
  {
    id: "comp-vanilla-cupcake-base",
    name: "Vanilla Cupcake Base",
    type: "cake",
    yieldAmount: 12,
    yieldUnit: "cupcakes",
    notes:
      "Shared base for vanilla and strawberry cupcakes. Derived from the lemon cupcake base (no zest) - confirm against her real vanilla recipe.",
    lines: [
      line("cake-flour", "1 3/4 cups", { detail: "220 g", grams: 220 }),
      line("ap-flour", "2/3 cup", { detail: "85 g", grams: 85 }),
      line("granulated-sugar", "1 3/4 cups", { detail: "350 g", grams: 350 }),
      line("baking-powder", "2 tsp", { detail: "8 g", grams: 8 }),
      line("salt", "1 1/8 tsp", { detail: "7 g", grams: 7 }),
      line("baking-soda", "1/8 tsp", { detail: "1 g", grams: 1 }),
      line("heavy-cream", "1 cup", { detail: "240 g", grams: 240 }),
      line("veg-oil", "2/3 cup", { detail: "150 g", grams: 150 }),
      line("buttermilk", "1/4 cup", { detail: "60 g", grams: 60 }),
      line("eggs", "3", { count: 3 }),
      line("vanilla-extract", "1 tbsp", { detail: "13 g", grams: 13 }),
    ],
  },
  {
    id: "comp-choc-cupcake-base",
    name: "Chocolate Cupcake Base",
    type: "cake",
    yieldAmount: 24,
    yieldUnit: "cupcakes",
    notes: "Chocolate Oreo cupcake batter.",
    lines: [
      line("ap-flour", "8 oz", { detail: "227 g", grams: 227 }),
      line("granulated-sugar", "5 oz", { detail: "142 g", grams: 142 }),
      line("brown-sugar", "3 oz", { detail: "85 g", grams: 85 }),
      line("cocoa", "3 oz", { detail: "85 g", grams: 85 }),
      line("baking-soda", "1 tsp", { detail: "5 g", grams: 5 }),
      line("baking-powder", "1/2 tsp", { detail: "2 g", grams: 2 }),
      line("eggs", "2", { count: 2 }),
      line("buttermilk", "10 oz, hot", { detail: "284 g", grams: 284 }),
      line("butter", "4 oz, softened", { detail: "113 g", grams: 113 }),
      line("veg-oil", "4 oz", { detail: "113 g", grams: 113 }),
      line("vanilla-extract", "2 tsp", { detail: "8 g", grams: 8 }),
      line("espresso", "1 tbsp (optional)", { detail: "7 g", grams: 7 }),
      line("salt", "1/2 tsp", { detail: "3 g", grams: 3 }),
    ],
  },
  {
    id: "comp-buttercream",
    name: "Standard Buttercream",
    type: "frosting",
    yieldAmount: 36,
    yieldUnit: "cupcakes frosted",
    notes:
      "One base recipe. Vanilla = plain; Oreo = fold in crushed Oreos; Strawberry = fold in freeze-dried strawberries.",
    lines: [
      line("egg-whites", "8 oz", { detail: "227 g", grams: 227 }),
      line("powdered-sugar", "32 oz", { detail: "907 g", grams: 907 }),
      line("butter", "32 oz, room temp", { detail: "907 g", grams: 907 }),
      line("salt", "1/2 tsp", { detail: "3 g", grams: 3 }),
      line("vanilla-extract", "1 tbsp", { detail: "13 g", grams: 13 }),
    ],
  },
  {
    id: "comp-oreo-mixin",
    name: "Oreo Crumb Mix-in",
    type: "topping",
    yieldAmount: 24,
    yieldUnit: "cupcakes",
    notes: "Crushed Oreos folded into standard buttercream for Oreo flavor.",
    lines: [line("oreos", "~12, crushed", { count: 12 })],
  },
  {
    id: "comp-strawberry-mixin",
    name: "Freeze-dried Strawberry Mix-in",
    type: "topping",
    yieldAmount: 12,
    yieldUnit: "cupcakes",
    notes: "Powdered into batter and buttercream for strawberry flavor.",
    lines: [line("freeze-dried-strawberries", "~20 g, powdered", { grams: 20 })],
  },
  {
    id: "comp-lemon-curd",
    name: "Lemon Curd",
    type: "filling",
    yieldAmount: 30,
    yieldUnit: "cupcakes filled",
    notes: "Record the actual fill count as you bake.",
    lines: [
      line("granulated-sugar", "1/2 cup", { detail: "100 g", grams: 100 }),
      line("egg-yolks", "3", { count: 3 }),
      line("cornstarch", "1 tsp", { detail: "3 g", grams: 3 }),
      line("lemons", "zest + juice of ~3", { count: 3 }),
      line("butter", "1/4 cup, sliced", { detail: "55 g", grams: 55 }),
    ],
  },
  {
    id: "comp-mascarpone-frosting",
    name: "Mascarpone Whipped Frosting",
    type: "frosting",
    yieldAmount: 10,
    yieldUnit: "servings",
    notes: "Do not freeze. Make only what you need.",
    lines: [
      line("mascarpone", "1 cup, cold", { detail: "225 g", grams: 225 }),
      line("powdered-sugar", "1/2 cup", { detail: "55 g", grams: 55 }),
      line("vanilla-extract", "1 tsp", { detail: "4 g", grams: 4 }),
      line("whipping-cream", "1 1/2 cups, cold", { detail: "335 g", grams: 335 }),
    ],
  },
  {
    id: "comp-strawberry-filling",
    name: "Strawberry Filling",
    type: "filling",
    yieldAmount: 10,
    yieldUnit: "servings",
    notes: "Record actual yield.",
    lines: [
      line("water", "1 cup", { detail: "240 g", grams: 240 }),
      line("cornstarch", "3 tbsp", { detail: "24 g", grams: 24 }),
      line("frozen-strawberries", "2 1/2 cups, thawed & chopped", { detail: "~350 g", grams: 350 }),
      line("granulated-sugar", "3/4 cup", { detail: "150 g", grams: 150 }),
    ],
  },
];

export const seedMenuItems: MenuItem[] = [
  {
    id: "mi-strawberry-cupcake",
    name: "Strawberry Cupcake",
    flavorTag: "strawberry",
    isPrimary: true,
    isPlaceholder: false,
    assemblyNotes:
      "Fold strawberry powder into a portion of batter and buttercream. Top with freeze-dried strawberry dust.",
    components: [
      { componentId: "comp-vanilla-cupcake-base", scale: 1, sort: 0 },
      { componentId: "comp-buttercream", scale: 1, sort: 1 },
      { componentId: "comp-strawberry-mixin", scale: 1, sort: 2 },
    ],
  },
  {
    id: "mi-oreo-cupcake",
    name: "Oreo Cupcake",
    flavorTag: "oreo",
    isPrimary: true,
    isPlaceholder: false,
    assemblyNotes:
      "Frost with standard buttercream after folding in crushed Oreos. Garnish with an Oreo half.",
    components: [
      { componentId: "comp-choc-cupcake-base", scale: 1, sort: 0 },
      { componentId: "comp-buttercream", scale: 1, sort: 1 },
      { componentId: "comp-oreo-mixin", scale: 1, sort: 2 },
    ],
  },
  {
    id: "mi-vanilla-cupcake",
    name: "Vanilla Cupcake",
    flavorTag: "vanilla",
    isPrimary: true,
    isPlaceholder: true,
    assemblyNotes:
      "PLACEHOLDER - base derived from the lemon cupcake recipe (no zest). Replace with her real vanilla recipe when uploaded.",
    components: [
      { componentId: "comp-vanilla-cupcake-base", scale: 1, sort: 0 },
      { componentId: "comp-buttercream", scale: 1, sort: 1 },
    ],
  },
];

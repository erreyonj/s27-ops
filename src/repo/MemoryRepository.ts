/* Demo-mode repository: used ONLY when Supabase env vars are missing so the app
   can be previewed instantly. Data lives in memory (plus sessionStorage so a
   refresh doesn't wipe the demo menu). Not a second database - retired the
   moment .env is filled in. */
import {
  seedComponents,
  seedIngredients,
  seedMenuItems,
} from "../data/seed";
import { seedCategoryPackaging, seedPackagingSupplies } from "../data/packaging";
import {
  DEFAULT_BAKERY_SETTINGS,
  type AppData,
  type BakerySettings,
  type BaseUnit,
  type Category,
  type CategoryPackagingLine,
  type ItemComponent,
  type MenuItem,
  type MenuEntry,
  type PackagingSupply,
  type RawIngredient,
} from "../domain/types";
import type { Repository } from "./Repository";

const SS_KEY = "tn-demo-state";

interface DemoState {
  ingredients: RawIngredient[];
  components: ItemComponent[];
  menuItems: MenuItem[];
  entries: MenuEntry[];
  settings: BakerySettings;
  packagingSupplies: PackagingSupply[];
  categoryPackaging: CategoryPackagingLine[];
}

function normalizeMenuItem(m: MenuItem): MenuItem {
  return {
    ...m,
    brandName: m.brandName ?? m.name,
    category: m.category ?? "other",
    yieldAmount: m.yieldAmount ?? 1,
    yieldUnit: m.yieldUnit ?? "batch",
    laborHours: m.laborHours ?? null,
    marginPct: m.marginPct ?? null,
    discountPct: m.discountPct ?? null,
    publishToSite: m.publishToSite ?? false,
  };
}

function loadState(): DemoState {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DemoState>;
      return {
        ingredients: parsed.ingredients ?? structuredClone(seedIngredients),
        components: parsed.components ?? structuredClone(seedComponents),
        menuItems: (parsed.menuItems ?? structuredClone(seedMenuItems)).map(normalizeMenuItem),
        entries: parsed.entries ?? [],
        settings: { ...DEFAULT_BAKERY_SETTINGS, ...(parsed.settings ?? {}) },
        packagingSupplies:
          parsed.packagingSupplies ?? structuredClone(seedPackagingSupplies),
        categoryPackaging:
          parsed.categoryPackaging ?? structuredClone(seedCategoryPackaging),
      };
    }
  } catch {
    /* fall through to fresh seed */
  }
  return {
    ingredients: structuredClone(seedIngredients),
    components: structuredClone(seedComponents),
    menuItems: structuredClone(seedMenuItems).map(normalizeMenuItem),
    entries: [],
    settings: structuredClone(DEFAULT_BAKERY_SETTINGS),
    packagingSupplies: structuredClone(seedPackagingSupplies),
    categoryPackaging: structuredClone(seedCategoryPackaging),
  };
}

export class MemoryRepository implements Repository {
  readonly isDemo = true;
  private state: DemoState = loadState();

  private persist() {
    try {
      sessionStorage.setItem(SS_KEY, JSON.stringify(this.state));
    } catch {
      /* session storage unavailable; demo continues in memory */
    }
  }

  async loadAll(): Promise<AppData> {
    return {
      ingredients: this.state.ingredients,
      components: this.state.components,
      menuItems: this.state.menuItems,
      menu: { id: "current", weekOf: null, entries: this.state.entries },
      settings: this.state.settings,
      packagingSupplies: this.state.packagingSupplies,
      categoryPackaging: this.state.categoryPackaging,
    };
  }

  async setMenuQuantity(menuItemId: string, quantity: number): Promise<void> {
    const existing = this.state.entries.find((e) => e.menuItemId === menuItemId);
    if (existing) existing.quantity = quantity;
    else this.state.entries.push({ menuItemId, quantity });
    this.persist();
  }

  async removeMenuEntry(menuItemId: string): Promise<void> {
    this.state.entries = this.state.entries.filter((e) => e.menuItemId !== menuItemId);
    this.persist();
  }

  async clearMenu(): Promise<void> {
    this.state.entries = [];
    this.persist();
  }

  async upsertComponent(component: ItemComponent): Promise<void> {
    const i = this.state.components.findIndex((c) => c.id === component.id);
    if (i >= 0) this.state.components[i] = component;
    else this.state.components.push(component);
    this.persist();
  }

  async upsertMenuItem(item: MenuItem): Promise<void> {
    const normalized = normalizeMenuItem(item);
    const i = this.state.menuItems.findIndex((m) => m.id === normalized.id);
    if (i >= 0) this.state.menuItems[i] = normalized;
    else this.state.menuItems.push(normalized);
    this.persist();
  }

  async updateIngredientPrice(
    id: string,
    packPrice: number | null,
    packQty: number | null,
    packQtyUnit: BaseUnit | null
  ): Promise<void> {
    const ing = this.state.ingredients.find((x) => x.id === id);
    if (ing) {
      ing.packPrice = packPrice;
      ing.packQty = packQty;
      ing.packQtyUnit = packQtyUnit;
      this.persist();
    }
  }

  async upsertIngredient(ingredient: RawIngredient): Promise<void> {
    const i = this.state.ingredients.findIndex((x) => x.id === ingredient.id);
    if (i >= 0) this.state.ingredients[i] = ingredient;
    else this.state.ingredients.push(ingredient);
    this.persist();
  }

  async upsertPackagingSupply(supply: PackagingSupply): Promise<void> {
    const i = this.state.packagingSupplies.findIndex((s) => s.id === supply.id);
    if (i >= 0) this.state.packagingSupplies[i] = supply;
    else this.state.packagingSupplies.push(supply);
    this.persist();
  }

  async setCategoryPackaging(
    category: Category,
    lines: CategoryPackagingLine[]
  ): Promise<void> {
    this.state.categoryPackaging = [
      ...this.state.categoryPackaging.filter((l) => l.category !== category),
      ...lines.map((l, i) => ({ ...l, category, sort: l.sort ?? i })),
    ];
    this.persist();
  }

  async updateBakerySettings(settings: BakerySettings): Promise<void> {
    this.state.settings = { ...settings, id: "default" };
    this.persist();
  }

  onMenuChange(): () => void {
    return () => {};
  }

  async seedStarterData(): Promise<void> {
    /* Demo data is already seeded in memory. */
  }
}

/* Demo-mode repository: used ONLY when Supabase env vars are missing so the app
   can be previewed instantly. Data lives in memory (plus sessionStorage so a
   refresh doesn't wipe the demo menu). Not a second database - retired the
   moment .env is filled in. */
import { seedComponents, seedIngredients, seedMenuItems } from "../data/seed";
import type {
  AppData,
  ItemComponent,
  MenuItem,
  MenuEntry,
  RawIngredient,
} from "../domain/types";
import type { Repository } from "./Repository";

const SS_KEY = "tn-demo-state";

interface DemoState {
  ingredients: RawIngredient[];
  components: ItemComponent[];
  menuItems: MenuItem[];
  entries: MenuEntry[];
}

function loadState(): DemoState {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through to fresh seed */
  }
  return {
    ingredients: structuredClone(seedIngredients),
    components: structuredClone(seedComponents),
    menuItems: structuredClone(seedMenuItems),
    entries: [],
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
    const i = this.state.menuItems.findIndex((m) => m.id === item.id);
    if (i >= 0) this.state.menuItems[i] = item;
    else this.state.menuItems.push(item);
    this.persist();
  }

  async updateIngredientPrice(
    id: string,
    packPrice: number | null,
    packQty: number | null,
    packQtyUnit: "g" | "count" | null
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

  onMenuChange(): () => void {
    return () => {};
  }

  async seedStarterData(): Promise<void> {
    /* Demo data is already seeded in memory. */
  }
}

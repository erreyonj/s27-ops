import type {
  AppData,
  BakerySettings,
  BaseUnit,
  ItemComponent,
  MenuItem,
  RawIngredient,
} from "../domain/types";

export interface Repository {
  /** Load everything (dataset is small; one shot keeps aggregation simple). */
  loadAll(): Promise<AppData>;

  setMenuQuantity(menuItemId: string, quantity: number): Promise<void>;
  removeMenuEntry(menuItemId: string): Promise<void>;
  clearMenu(): Promise<void>;

  /** Create or update a component (with its lines) and a menu item. */
  upsertComponent(component: ItemComponent): Promise<void>;
  upsertMenuItem(item: MenuItem): Promise<void>;

  updateIngredientPrice(
    id: string,
    packPrice: number | null,
    packQty: number | null,
    packQtyUnit: BaseUnit | null
  ): Promise<void>;
  upsertIngredient(ingredient: RawIngredient): Promise<void>;

  updateBakerySettings(settings: BakerySettings): Promise<void>;

  /** Subscribe to remote menu changes (returns unsubscribe). No-op in demo mode. */
  onMenuChange(cb: () => void): () => void;

  /** Populate a fresh database with the starter ingredients/components/menu items.
      Runs with the signed-in session (RLS allows authenticated writes), so no
      service-role key is required. No-op in demo mode (already seeded). */
  seedStarterData(): Promise<void>;

  readonly isDemo: boolean;
}

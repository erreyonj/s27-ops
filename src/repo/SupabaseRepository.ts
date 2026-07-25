import { getSupabase } from "../lib/supabase";
import { seedComponents, seedIngredients, seedMenuItems } from "../data/seed";
import {
  DEFAULT_BAKERY_SETTINGS,
  type AppData,
  type BakerySettings,
  type BaseUnit,
  type ComponentType,
  type ItemComponent,
  type MenuItem,
  type RawIngredient,
} from "../domain/types";
import type { Repository } from "./Repository";

/* Row mappers: snake_case DB rows -> camelCase domain types. */
function toIngredient(r: any): RawIngredient {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    baseUnit: r.base_unit as BaseUnit,
    suggestedStore: r.suggested_store,
    packageSize: r.package_size,
    roundTo: r.round_to === null ? null : Number(r.round_to),
    roundLabel: r.round_label,
    packPrice: r.pack_price === null ? null : Number(r.pack_price),
    packQty: r.pack_qty === null ? null : Number(r.pack_qty),
    packQtyUnit: r.pack_qty_unit,
  };
}

function toSettings(r: any | null | undefined): BakerySettings {
  if (!r) return { ...DEFAULT_BAKERY_SETTINGS };
  return {
    id: r.id ?? "default",
    hourlyRate: Number(r.hourly_rate ?? DEFAULT_BAKERY_SETTINGS.hourlyRate),
    salesTaxPct: Number(r.sales_tax_pct ?? DEFAULT_BAKERY_SETTINGS.salesTaxPct),
    defaultMarginPct: Number(r.default_margin_pct ?? DEFAULT_BAKERY_SETTINGS.defaultMarginPct),
    defaultDiscountPct: Number(
      r.default_discount_pct ?? DEFAULT_BAKERY_SETTINGS.defaultDiscountPct
    ),
  };
}

function toMenuItem(m: any, itemComps: any[]): MenuItem {
  return {
    id: m.id,
    name: m.name,
    flavorTag: m.flavor_tag,
    isPrimary: m.is_primary,
    isPlaceholder: m.is_placeholder,
    assemblyNotes: m.assembly_notes,
    yieldAmount: Number(m.yield_amount ?? 1),
    yieldUnit: m.yield_unit ?? "batch",
    laborHours: m.labor_hours === null || m.labor_hours === undefined ? null : Number(m.labor_hours),
    marginPct: m.margin_pct === null || m.margin_pct === undefined ? null : Number(m.margin_pct),
    discountPct:
      m.discount_pct === null || m.discount_pct === undefined ? null : Number(m.discount_pct),
    components: itemComps
      .filter((mc: any) => mc.menu_item_id === m.id)
      .map((mc: any) => ({
        componentId: mc.component_id,
        scale: Number(mc.scale),
        sort: mc.sort,
      })),
  };
}

export class SupabaseRepository implements Repository {
  readonly isDemo = false;

  async loadAll(): Promise<AppData> {
    const sb = getSupabase();
    const [ing, comps, lines, items, itemComps, entries, menuRow, settingsRow] = await Promise.all([
      sb.from("raw_ingredients").select("*").order("name"),
      sb.from("item_components").select("*").order("name"),
      sb.from("component_lines").select("*").order("sort"),
      sb.from("menu_items").select("*").order("name"),
      sb.from("menu_item_components").select("*").order("sort"),
      sb.from("current_menu_entries").select("*").eq("menu_id", "current"),
      sb.from("current_menu").select("*").eq("id", "current").maybeSingle(),
      sb.from("bakery_settings").select("*").eq("id", "default").maybeSingle(),
    ]);
    for (const res of [ing, comps, lines, items, itemComps, entries, menuRow, settingsRow]) {
      if (res.error) throw res.error;
    }

    const components: ItemComponent[] = (comps.data ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type as ComponentType,
      yieldAmount: Number(c.yield_amount),
      yieldUnit: c.yield_unit,
      notes: c.notes,
      lines: (lines.data ?? [])
        .filter((l: any) => l.component_id === c.id)
        .map((l: any) => ({
          id: l.id,
          ingredientId: l.ingredient_id,
          qtyText: l.qty_text,
          detail: l.detail,
          grams: l.grams === null ? null : Number(l.grams),
          count: l.count === null ? null : Number(l.count),
          tsp: l.tsp === null || l.tsp === undefined ? null : Number(l.tsp),
          sort: l.sort,
        })),
    }));

    const menuItems: MenuItem[] = (items.data ?? []).map((m: any) =>
      toMenuItem(m, itemComps.data ?? [])
    );

    return {
      ingredients: (ing.data ?? []).map(toIngredient),
      components,
      menuItems,
      menu: {
        id: "current",
        weekOf: menuRow.data?.week_of ?? null,
        entries: (entries.data ?? []).map((e: any) => ({
          menuItemId: e.menu_item_id,
          quantity: e.quantity,
        })),
      },
      settings: toSettings(settingsRow.data),
    };
  }

  async setMenuQuantity(menuItemId: string, quantity: number): Promise<void> {
    const sb = getSupabase();
    const { error } = await sb
      .from("current_menu_entries")
      .upsert(
        { menu_id: "current", menu_item_id: menuItemId, quantity },
        { onConflict: "menu_id,menu_item_id" }
      );
    if (error) throw error;
  }

  async removeMenuEntry(menuItemId: string): Promise<void> {
    const sb = getSupabase();
    const { error } = await sb
      .from("current_menu_entries")
      .delete()
      .eq("menu_id", "current")
      .eq("menu_item_id", menuItemId);
    if (error) throw error;
  }

  async clearMenu(): Promise<void> {
    const sb = getSupabase();
    const { error } = await sb
      .from("current_menu_entries")
      .delete()
      .eq("menu_id", "current");
    if (error) throw error;
  }

  async upsertComponent(component: ItemComponent): Promise<void> {
    const sb = getSupabase();
    const { error } = await sb.from("item_components").upsert({
      id: component.id,
      name: component.name,
      type: component.type,
      yield_amount: component.yieldAmount,
      yield_unit: component.yieldUnit,
      notes: component.notes,
    });
    if (error) throw error;
    const del = await sb.from("component_lines").delete().eq("component_id", component.id);
    if (del.error) throw del.error;
    if (component.lines.length) {
      const ins = await sb.from("component_lines").insert(
        component.lines.map((l, i) => ({
          component_id: component.id,
          ingredient_id: l.ingredientId,
          qty_text: l.qtyText,
          detail: l.detail,
          grams: l.grams,
          count: l.count,
          tsp: l.tsp ?? null,
          sort: i,
        }))
      );
      if (ins.error) throw ins.error;
    }
  }

  async upsertMenuItem(item: MenuItem): Promise<void> {
    const sb = getSupabase();
    const { error } = await sb.from("menu_items").upsert({
      id: item.id,
      name: item.name,
      flavor_tag: item.flavorTag,
      is_primary: item.isPrimary,
      is_placeholder: item.isPlaceholder,
      assembly_notes: item.assemblyNotes,
      yield_amount: item.yieldAmount,
      yield_unit: item.yieldUnit,
      labor_hours: item.laborHours,
      margin_pct: item.marginPct,
      discount_pct: item.discountPct,
    });
    if (error) throw error;
    const del = await sb.from("menu_item_components").delete().eq("menu_item_id", item.id);
    if (del.error) throw del.error;
    if (item.components.length) {
      const ins = await sb.from("menu_item_components").insert(
        item.components.map((c, i) => ({
          menu_item_id: item.id,
          component_id: c.componentId,
          scale: c.scale,
          sort: i,
        }))
      );
      if (ins.error) throw ins.error;
    }
  }

  async updateIngredientPrice(
    id: string,
    packPrice: number | null,
    packQty: number | null,
    packQtyUnit: BaseUnit | null
  ): Promise<void> {
    const sb = getSupabase();
    const { error } = await sb
      .from("raw_ingredients")
      .update({ pack_price: packPrice, pack_qty: packQty, pack_qty_unit: packQtyUnit })
      .eq("id", id);
    if (error) throw error;
  }

  async upsertIngredient(ing: RawIngredient): Promise<void> {
    const sb = getSupabase();
    const { error } = await sb.from("raw_ingredients").upsert({
      id: ing.id,
      name: ing.name,
      category: ing.category,
      base_unit: ing.baseUnit,
      suggested_store: ing.suggestedStore,
      package_size: ing.packageSize,
      round_to: ing.roundTo,
      round_label: ing.roundLabel,
      pack_price: ing.packPrice,
      pack_qty: ing.packQty,
      pack_qty_unit: ing.packQtyUnit,
    });
    if (error) throw error;
  }

  async updateBakerySettings(settings: BakerySettings): Promise<void> {
    const sb = getSupabase();
    const { error } = await sb.from("bakery_settings").upsert({
      id: "default",
      hourly_rate: settings.hourlyRate,
      sales_tax_pct: settings.salesTaxPct,
      default_margin_pct: settings.defaultMarginPct,
      default_discount_pct: settings.defaultDiscountPct,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

  onMenuChange(cb: () => void): () => void {
    const sb = getSupabase();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => cb(), 400);
    };
    const channel = sb
      .channel("menu-sync")
      .on("postgres_changes", { event: "*", schema: "public" }, scheduleRefresh)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      sb.removeChannel(channel);
    };
  }

  async seedStarterData(): Promise<void> {
    const sb = getSupabase();

    const settingsRes = await sb.from("bakery_settings").upsert({
      id: "default",
      hourly_rate: DEFAULT_BAKERY_SETTINGS.hourlyRate,
      sales_tax_pct: DEFAULT_BAKERY_SETTINGS.salesTaxPct,
      default_margin_pct: DEFAULT_BAKERY_SETTINGS.defaultMarginPct,
      default_discount_pct: DEFAULT_BAKERY_SETTINGS.defaultDiscountPct,
    });
    if (settingsRes.error) throw settingsRes.error;

    const ingRes = await sb.from("raw_ingredients").upsert(
      seedIngredients.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        base_unit: i.baseUnit,
        suggested_store: i.suggestedStore,
        package_size: i.packageSize,
        round_to: i.roundTo,
        round_label: i.roundLabel,
        pack_price: i.packPrice,
        pack_qty: i.packQty,
        pack_qty_unit: i.packQtyUnit,
      }))
    );
    if (ingRes.error) throw ingRes.error;

    for (const c of seedComponents) {
      await this.upsertComponent(c);
    }
    for (const m of seedMenuItems) {
      await this.upsertMenuItem(m);
    }

    const menuRes = await sb.from("current_menu").upsert({ id: "current" });
    if (menuRes.error) throw menuRes.error;
  }
}

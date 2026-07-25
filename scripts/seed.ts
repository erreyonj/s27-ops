/* Seeds a Supabase project with the migrated bakery data.
   Usage:
     VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed
   (or put both in .env — this script reads it.) */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { seedComponents, seedIngredients, seedMenuItems } from "../src/data/seed.ts";

function loadDotEnv(): void {
  try {
    for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* no .env file; rely on process env */
  }
}
loadDotEnv();

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (set in .env or the environment)."
  );
  process.exit(1);
}

const sb = createClient(url, serviceKey);

async function run() {
  console.log("Seeding bakery_settings…");
  {
    const { error } = await sb.from("bakery_settings").upsert({
      id: "default",
      hourly_rate: 20,
      sales_tax_pct: 0,
      default_margin_pct: 0.35,
      default_discount_pct: 0,
    });
    if (error) throw error;
  }

  console.log("Seeding raw_ingredients…");
  {
    const { error } = await sb.from("raw_ingredients").upsert(
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
    if (error) throw error;
  }

  console.log("Seeding item_components + lines…");
  for (const c of seedComponents) {
    const { error } = await sb.from("item_components").upsert({
      id: c.id,
      name: c.name,
      type: c.type,
      yield_amount: c.yieldAmount,
      yield_unit: c.yieldUnit,
      notes: c.notes,
    });
    if (error) throw error;
    const del = await sb.from("component_lines").delete().eq("component_id", c.id);
    if (del.error) throw del.error;
    const ins = await sb.from("component_lines").insert(
      c.lines.map((l, i) => ({
        component_id: c.id,
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

  console.log("Seeding menu_items + composition…");
  for (const m of seedMenuItems) {
    const { error } = await sb.from("menu_items").upsert({
      id: m.id,
      name: m.name,
      flavor_tag: m.flavorTag,
      is_primary: m.isPrimary,
      is_placeholder: m.isPlaceholder,
      assembly_notes: m.assemblyNotes,
      yield_amount: m.yieldAmount,
      yield_unit: m.yieldUnit,
      labor_hours: m.laborHours,
      margin_pct: m.marginPct,
      discount_pct: m.discountPct,
    });
    if (error) throw error;
    const del = await sb.from("menu_item_components").delete().eq("menu_item_id", m.id);
    if (del.error) throw del.error;
    const ins = await sb.from("menu_item_components").insert(
      m.components.map((ref, i) => ({
        menu_item_id: m.id,
        component_id: ref.componentId,
        scale: ref.scale,
        sort: i,
      }))
    );
    if (ins.error) throw ins.error;
  }

  const menu = await sb.from("current_menu").upsert({ id: "current" });
  if (menu.error) throw menu.error;

  console.log(
    "Done. Seeded",
    seedIngredients.length,
    "ingredients,",
    seedComponents.length,
    "components,",
    seedMenuItems.length,
    "menu items."
  );
}

run().catch((e) => {
  console.error("Seed failed:", e.message ?? e);
  process.exit(1);
});

-- Brown Sugar Cinnamon Pop Tart Bars (Recime) + add to publish lineup.
-- Run in Supabase SQL Editor after prior migrations.

-- ---------------------------------------------------------------------------
-- 1. Component
-- ---------------------------------------------------------------------------
insert into item_components (id, name, category, yield_amount, yield_unit, notes)
values (
  'comp-brown-sugar-cinnamon-pop-tart-bars',
  'Brown Sugar Cinnamon Pop Tart Bars',
  'dough',
  12,
  'bars',
  'Recime · Brown Sugar Cinnamon Pop Tart Bars · 8-in square · filling + cinnamon glaze inline · 325°F 30–40 min'
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;

delete from component_lines where component_id = 'comp-brown-sugar-cinnamon-pop-tart-bars';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-brown-sugar-cinnamon-pop-tart-bars', 'unsalted-butter', '1 cup + 3 Tbsp', '226 g softened dough + 42 g melted filling · ≈268 g', 268, null, null, 0),
  ('comp-brown-sugar-cinnamon-pop-tart-bars', 'light-brown-sugar', '1 1/2 cups', '100 g dough + 200 g filling lightly packed · ≈300 g', 300, null, null, 1),
  ('comp-brown-sugar-cinnamon-pop-tart-bars', 'powdered-sugar', '1 3/4 cups', '90 g dough + 120 g glaze · ≈210 g', 210, null, null, 2),
  ('comp-brown-sugar-cinnamon-pop-tart-bars', 'mexican-vanilla-extract', '2 1/2 tsp', '2 tsp dough + 1/2 tsp glaze', null, null, 2.5, 3),
  ('comp-brown-sugar-cinnamon-pop-tart-bars', 'kosher-salt', '2 pinches', 'dough + glaze · ≈1/8 tsp', null, null, 0.12, 4),
  ('comp-brown-sugar-cinnamon-pop-tart-bars', 'eggs', '1 ea', 'large', null, 1, null, 5),
  ('comp-brown-sugar-cinnamon-pop-tart-bars', 'all-purpose-flour', '2 1/2 cups + 2 Tbsp', '300 g dough + 16 g filling · ≈316 g', 316, null, null, 6),
  ('comp-brown-sugar-cinnamon-pop-tart-bars', 'cinnamon', '4 1/2 tsp', '1 Tbsp filling + 1 1/2 tsp glaze', null, null, 4.5, 7),
  ('comp-brown-sugar-cinnamon-pop-tart-bars', 'heavy-whipping-cream', '3–4 Tbsp', 'glaze · ≈45–60 g', 52, null, null, 8);

-- ---------------------------------------------------------------------------
-- 2. Menu item (1:1)
-- ---------------------------------------------------------------------------
insert into menu_items (
  id, name, brand_name, flavor_tag, is_primary, is_placeholder, publish_to_site,
  assembly_notes, category, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct
)
values (
  'mi-brown-sugar-cinnamon-pop-tart-bars',
  'Brown Sugar Cinnamon Pop Tart Bars',
  'Brown Sugar Cinnamon Pop Tart Bars',
  'brown-sugar-cinnamon-pop-tart-bars',
  false, false, true,
  null,
  'dough', 12, 'bars', null, null, null
)
on conflict (id) do update set
  name = excluded.name,
  brand_name = excluded.brand_name,
  flavor_tag = excluded.flavor_tag,
  assembly_notes = excluded.assembly_notes,
  category = excluded.category,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  publish_to_site = excluded.publish_to_site;

delete from menu_item_components where menu_item_id = 'mi-brown-sugar-cinnamon-pop-tart-bars';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-brown-sugar-cinnamon-pop-tart-bars', 'comp-brown-sugar-cinnamon-pop-tart-bars', 1, 0);

-- ---------------------------------------------------------------------------
-- 3. Publish lineup (add — leave existing published items)
-- ---------------------------------------------------------------------------
update menu_items set publish_to_site = true
where id = 'mi-brown-sugar-cinnamon-pop-tart-bars';

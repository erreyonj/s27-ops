-- Week of 11/11 market menu: Apple Cider Donut Loaf, Chunky Pumpkin Cookie,
-- Brown Butter Cake wrapped with Fluffy Vanilla Frosting, and publish lineup.
-- Run in Supabase SQL Editor after prior migrations.

-- ---------------------------------------------------------------------------
-- 1. New ingredients (unpriced until Library)
-- ---------------------------------------------------------------------------
insert into raw_ingredients (id, name, category, base_unit, suggested_store, package_size, round_to, round_label, pack_price, pack_qty, pack_qty_unit)
values ('apple-cider', 'Apple Cider', 'wet', 'g', null, null, null, null, null, null, null)
on conflict (id) do update set name = excluded.name, category = excluded.category, base_unit = excluded.base_unit;

insert into raw_ingredients (id, name, category, base_unit, suggested_store, package_size, round_to, round_label, pack_price, pack_qty, pack_qty_unit)
values ('apple-butter', 'Apple Butter', 'produce', 'g', null, null, null, null, null, null, null)
on conflict (id) do update set name = excluded.name, category = excluded.category, base_unit = excluded.base_unit;

insert into raw_ingredients (id, name, category, base_unit, suggested_store, package_size, round_to, round_label, pack_price, pack_qty, pack_qty_unit)
values ('pumpkin-pie-spice', 'Pumpkin Pie Spice', 'dry', 'tsp', null, null, null, null, null, null, null)
on conflict (id) do update set name = excluded.name, category = excluded.category, base_unit = excluded.base_unit;

-- ---------------------------------------------------------------------------
-- 2. Apple Cider Donut Loaf
-- ---------------------------------------------------------------------------
insert into item_components (id, name, category, yield_amount, yield_unit, notes)
values (
  'comp-apple-cider-donut-loaf',
  'Apple Cider Donut Loaf',
  'dough',
  10,
  'slices',
  'Recime · Apple Cider Donut Loaf · reduce 360 g cider to ~120 g before batter · 8.5×4.5 pan'
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;

delete from component_lines where component_id = 'comp-apple-cider-donut-loaf';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-apple-cider-donut-loaf', 'apple-cider', '435 g', '360 g to reduce + 60 g batter + 15 g glaze', 435, null, null, 0),
  ('comp-apple-cider-donut-loaf', 'apple-butter', '136 g', '1/2 cup', 136, null, null, 1),
  ('comp-apple-cider-donut-loaf', 'granulated-sugar', '250 g', '200 g batter + 50 g cinnamon sugar', 250, null, null, 2),
  ('comp-apple-cider-donut-loaf', 'vegetable-oil', '140 g', '1/2 cup + 2 tbsp', 140, null, null, 3),
  ('comp-apple-cider-donut-loaf', 'eggs', '2 ea', 'large · ≈100 g', null, 2, null, 4),
  ('comp-apple-cider-donut-loaf', 'mexican-vanilla-extract', '1 1/2 tsp', null, null, null, 1.5, 5),
  ('comp-apple-cider-donut-loaf', 'all-purpose-flour', '281 g', '2 1/4 cups', 281, null, null, 6),
  ('comp-apple-cider-donut-loaf', 'baking-powder', '2 tsp', '≈8 g', null, null, 2, 7),
  ('comp-apple-cider-donut-loaf', 'cinnamon', '4 tsp', '2 tsp batter + 2 tsp topping', null, null, 4, 8),
  ('comp-apple-cider-donut-loaf', 'nutmeg', '1/2 tsp', null, null, null, 0.5, 9),
  ('comp-apple-cider-donut-loaf', 'kosher-salt', '1/2 tsp', null, null, null, 0.5, 10),
  ('comp-apple-cider-donut-loaf', 'salted-butter', '28 g', '2 tbsp melted · brush', 28, null, null, 11),
  ('comp-apple-cider-donut-loaf', 'powdered-sugar', '120 g', '1 cup · glaze', 120, null, null, 12),
  ('comp-apple-cider-donut-loaf', 'heavy-whipping-cream', '30 g', '2 tbsp · glaze', 30, null, null, 13);

insert into menu_items (
  id, name, brand_name, flavor_tag, is_primary, is_placeholder, publish_to_site,
  assembly_notes, category, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct
)
values (
  'mi-apple-cider-donut-loaf',
  'Apple Cider Donut Loaf',
  'Apple Cider Donut Loaf',
  'apple-cider-donut-loaf',
  false, false, true,
  null,
  'dough', 10, 'slices', null, null, null
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

delete from menu_item_components where menu_item_id = 'mi-apple-cider-donut-loaf';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-apple-cider-donut-loaf', 'comp-apple-cider-donut-loaf', 1, 0);

-- ---------------------------------------------------------------------------
-- 3. Levain-Style Chunky Pumpkin Cookie
-- ---------------------------------------------------------------------------
insert into item_components (id, name, category, yield_amount, yield_unit, notes)
values (
  'comp-chunky-pumpkin-cookie',
  'Chunky Pumpkin Cookie',
  'dough',
  6,
  'cookies',
  'Recime · Levain-style Chunky Pumpkin Cookie · streusel on top · PDF serves 12 → house yield 6'
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;

delete from component_lines where component_id = 'comp-chunky-pumpkin-cookie';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-chunky-pumpkin-cookie', 'all-purpose-flour', '450 g', '400 g dough + 50 g streusel', 450, null, null, 0),
  ('comp-chunky-pumpkin-cookie', 'baking-soda', '1 tsp', '≈6 g', null, null, 1, 1),
  ('comp-chunky-pumpkin-cookie', 'kosher-salt', '1/2 tsp', '≈3 g', null, null, 0.5, 2),
  ('comp-chunky-pumpkin-cookie', 'pumpkin-pie-spice', '2 1/2 tsp', '≈8 g', null, null, 2.5, 3),
  ('comp-chunky-pumpkin-cookie', 'unsalted-butter', '200 g', '150 g cold cubed dough + 50 g streusel', 200, null, null, 4),
  ('comp-chunky-pumpkin-cookie', 'light-brown-sugar', '200 g', '150 g dough + 50 g streusel', 200, null, null, 5),
  ('comp-chunky-pumpkin-cookie', 'granulated-sugar', '100 g', '1/2 cup', 100, null, null, 6),
  ('comp-chunky-pumpkin-cookie', 'eggs', '1 ea + 1 yolk', '1 large egg + 1 yolk', null, 2, null, 7),
  ('comp-chunky-pumpkin-cookie', 'pumpkin-puree', '100 g', '1/2 cup', 100, null, null, 8),
  ('comp-chunky-pumpkin-cookie', 'mexican-vanilla-extract', '1 tsp', '≈5 g', null, null, 1, 9);

insert into menu_items (
  id, name, brand_name, flavor_tag, is_primary, is_placeholder, publish_to_site,
  assembly_notes, category, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct
)
values (
  'mi-chunky-pumpkin-cookie',
  'Chunky Pumpkin Cookie',
  'Chunky Pumpkin Cookie',
  'chunky-pumpkin-cookie',
  false, false, true,
  null,
  'dough', 6, 'cookies', null, null, null
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

delete from menu_item_components where menu_item_id = 'mi-chunky-pumpkin-cookie';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-chunky-pumpkin-cookie', 'comp-chunky-pumpkin-cookie', 1, 0);

-- ---------------------------------------------------------------------------
-- 4. Brown Butter Cake + Fluffy Vanilla Frosting wrap
-- ---------------------------------------------------------------------------
insert into item_components (id, name, category, yield_amount, yield_unit, notes)
values (
  'comp-brown-butter-cake',
  'Brown Butter Cake',
  'cake',
  1,
  'cake',
  'Recime · Brown Butter Cake · three 8-in pans · 335°F'
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;

delete from component_lines where component_id = 'comp-brown-butter-cake';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-brown-butter-cake', 'cake-flour', '14 oz', '397 g', 397, null, null, 0),
  ('comp-brown-butter-cake', 'granulated-sugar', '8 oz', '227 g', 227, null, null, 1),
  ('comp-brown-butter-cake', 'light-brown-sugar', '4 oz', 'sifted · 113 g', 113, null, null, 2),
  ('comp-brown-butter-cake', 'baking-soda', '1 tsp', null, null, null, 1, 3),
  ('comp-brown-butter-cake', 'baking-powder', '1 tsp', null, null, null, 1, 4),
  ('comp-brown-butter-cake', 'kosher-salt', '1 tsp', null, null, null, 1, 5),
  ('comp-brown-butter-cake', 'mexican-vanilla-extract', '1 tbsp', null, null, null, 3, 6),
  ('comp-brown-butter-cake', 'buttermilk', '10 oz', 'warmed, divided · 283 g', 283, null, null, 7),
  ('comp-brown-butter-cake', 'eggs', '3 ea', 'room temperature', null, 3, null, 8),
  ('comp-brown-butter-cake', 'unsalted-butter', '8 oz', 'browned, room temperature · 227 g', 227, null, null, 9),
  ('comp-brown-butter-cake', 'vegetable-oil', '4 oz', '113 g', 113, null, null, 10);

insert into menu_items (
  id, name, brand_name, flavor_tag, is_primary, is_placeholder, publish_to_site,
  assembly_notes, category, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct
)
values (
  'mi-brown-butter-cake-vanilla-frosting',
  'Brown Butter Cake with Vanilla Frosting',
  'Brown Butter Cake with Vanilla Frosting',
  'brown-butter-cake-vanilla-frosting',
  false, false, true,
  'Brown Butter Cake + Fluffy Vanilla Frosting',
  'cake', 1, 'cake', null, null, null
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

delete from menu_item_components where menu_item_id = 'mi-brown-butter-cake-vanilla-frosting';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-brown-butter-cake-vanilla-frosting', 'comp-brown-butter-cake', 1, 0),
  ('mi-brown-butter-cake-vanilla-frosting', 'comp-fluffy-vanilla-frosting', 1, 1);

-- ---------------------------------------------------------------------------
-- 5. 11/11 publish lineup (replace)
-- ---------------------------------------------------------------------------
update menu_items set publish_to_site = true
where id in (
  'mi-bb-cc-cookies',
  'mi-bb-rice-crispy-treats',
  'mi-chocolate-cake-fluffy-choc-frosting',
  'mi-apple-cider-donut-loaf',
  'mi-chunky-pumpkin-cookie',
  'mi-brown-butter-cake-vanilla-frosting'
);

update menu_items set publish_to_site = false
where id in (
  'mi-apple-spice-cake-bb-bc',
  'mi-of-banana-bread',
  'mi-salted-caramel-apple-cookie'
);

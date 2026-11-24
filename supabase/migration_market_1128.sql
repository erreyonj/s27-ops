-- Week of Small Business Saturday (Nov 28) plus the Wednesday market.
-- Public site has one publish list, so this is the union of both menus.
-- Run in Supabase SQL Editor after prior migrations.

-- ---------------------------------------------------------------------------
-- 1. New ingredient (unpriced until Library)
-- ---------------------------------------------------------------------------
insert into raw_ingredients (id, name, category, base_unit, suggested_store, package_size, round_to, round_label, pack_price, pack_qty, pack_qty_unit)
values ('sliced-almonds', 'Sliced Almonds', 'other', 'g', null, null, null, null, null, null, null)
on conflict (id) do update set name = excluded.name, category = excluded.category, base_unit = excluded.base_unit;

-- ---------------------------------------------------------------------------
-- 2. Maple pecan toffee (partial batch on the pecan pie cookies)
-- ---------------------------------------------------------------------------
insert into item_components (id, name, category, yield_amount, yield_unit, notes)
values (
  'comp-maple-pecan-toffee',
  'Maple Pecan Toffee',
  'other',
  335,
  'g',
  'Recime · Brown Butter Pecan Pie Cookies toffee · boil to 280°F · ≈335 g before moisture loss · cookie uses ~1 cup / 150 g'
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;

delete from component_lines where component_id = 'comp-maple-pecan-toffee';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-maple-pecan-toffee', 'unsalted-butter', '100 g', '1/2 cup', 100, null, null, 0),
  ('comp-maple-pecan-toffee', 'light-brown-sugar', '150 g', '3/4 cup packed', 150, null, null, 1),
  ('comp-maple-pecan-toffee', 'maple-syrup', '1 tbsp', null, null, null, 3, 2),
  ('comp-maple-pecan-toffee', 'kosher-salt', '1/8 tsp', null, null, null, 0.125, 3),
  ('comp-maple-pecan-toffee', 'mexican-vanilla-extract', '1 tsp', null, null, null, 1, 4),
  ('comp-maple-pecan-toffee', 'pecans', '65 g', 'chopped, toasted', 65, null, null, 5);

-- ---------------------------------------------------------------------------
-- 3. Brown Butter Pecan Pie Cookies (market name: Maple Pecan)
-- ---------------------------------------------------------------------------
insert into item_components (id, name, category, yield_amount, yield_unit, notes)
values (
  'comp-brown-butter-pecan-pie-cookies',
  'Brown Butter Pecan Pie Cookies',
  'dough',
  6,
  'cookies',
  'Recime · Brown Butter Pecan Pie Cookies · PDF serves 24 ignored · house Levain yield 6 · fold in ~150 g maple pecan toffee · 350°F 15–18 min from frozen'
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;

delete from component_lines where component_id = 'comp-brown-butter-pecan-pie-cookies';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-brown-butter-pecan-pie-cookies', 'all-purpose-flour', '390 g', '3 cups + 2 tbsp', 390, null, null, 0),
  ('comp-brown-butter-pecan-pie-cookies', 'baking-powder', '2 tsp', '8 g', null, null, 2, 1),
  ('comp-brown-butter-pecan-pie-cookies', 'kosher-salt', '1/2 tsp', '3 g', null, null, 0.5, 2),
  ('comp-brown-butter-pecan-pie-cookies', 'baking-soda', '1 tsp', '6 g', null, null, 1, 3),
  ('comp-brown-butter-pecan-pie-cookies', 'corn-starch', '1 1/4 tsp', '4 g', 4, null, null, 4),
  ('comp-brown-butter-pecan-pie-cookies', 'cinnamon', '1 tsp', null, null, null, 1, 5),
  ('comp-brown-butter-pecan-pie-cookies', 'nutmeg', '1/4 tsp', null, null, null, 0.25, 6),
  ('comp-brown-butter-pecan-pie-cookies', 'cloves', '1/8 tsp', 'optional', null, null, 0.125, 7),
  ('comp-brown-butter-pecan-pie-cookies', 'unsalted-butter', '227 g', '2 sticks, measure before browning', 227, null, null, 8),
  ('comp-brown-butter-pecan-pie-cookies', 'light-brown-sugar', '250 g', '1 1/4 cup packed', 250, null, null, 9),
  ('comp-brown-butter-pecan-pie-cookies', 'granulated-sugar', '80 g', '1/3 cup', 80, null, null, 10),
  ('comp-brown-butter-pecan-pie-cookies', 'eggs', '1 ea + 2 yolks', '1 large + 2 yolks', null, 3, null, 11),
  ('comp-brown-butter-pecan-pie-cookies', 'mexican-vanilla-extract', '1 tsp', 'or vanilla paste', null, null, 1, 12),
  ('comp-brown-butter-pecan-pie-cookies', 'pecans', '62 g', 'toasted · PDF range 50–75 g, midpoint', 62, null, null, 13);

insert into menu_items (
  id, name, brand_name, flavor_tag, is_primary, is_placeholder, publish_to_site,
  assembly_notes, category, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct
)
values (
  'mi-brown-butter-maple-pecan-cookies',
  'Brown Butter Pecan Pie Cookies',
  'Brown Butter Maple Pecan Cookies',
  'brown-butter-maple-pecan-cookies',
  false, false, true,
  'Cookie dough + ~150 g maple pecan toffee',
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

delete from menu_item_components where menu_item_id = 'mi-brown-butter-maple-pecan-cookies';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-brown-butter-maple-pecan-cookies', 'comp-brown-butter-pecan-pie-cookies', 1, 0),
  ('mi-brown-butter-maple-pecan-cookies', 'comp-maple-pecan-toffee', 0.448, 1);

-- ---------------------------------------------------------------------------
-- 4. Almond Croissant Bars
-- ---------------------------------------------------------------------------
insert into item_components (id, name, category, yield_amount, yield_unit, notes)
values (
  'comp-almond-croissant-bars',
  'Almond Croissant Bars',
  'dough',
  9,
  'bars',
  'Recime · Dee & Sweets · 8x8 or 9x9 · crust + frangipane + nut crumble inline · PDF 9 squares or 18 triangles · market note: double into a 9x13 and cut 12'
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;

delete from component_lines where component_id = 'comp-almond-croissant-bars';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-almond-croissant-bars', 'unsalted-butter', '1 1/2 cups', '1 cup crust + 1/2 cup frangipane · 339 g', 339, null, null, 0),
  ('comp-almond-croissant-bars', 'granulated-sugar', '1 3/4 cups', '3/4 cup superfine (sub granulated) + 1 cup frangipane · ≈350 g', 350, null, null, 1),
  ('comp-almond-croissant-bars', 'mexican-vanilla-extract', '1 tbsp + 2 tsp', '1 tbsp crust + 2 tsp frangipane', null, null, 5, 2),
  ('comp-almond-croissant-bars', 'kosher-salt', '1/4 tsp', null, null, null, 0.25, 3),
  ('comp-almond-croissant-bars', 'all-purpose-flour', '2 1/2 cups + 1 tbsp', '300 g crust + 8 g frangipane · ≈308 g', 308, null, null, 4),
  ('comp-almond-croissant-bars', 'almond-extract', '1/4 tsp', null, null, null, 0.25, 5),
  ('comp-almond-croissant-bars', 'eggs', '2 ea', 'room temperature', null, 2, null, 6),
  ('comp-almond-croissant-bars', 'almond-flour', '2 cups', '≈192 g · 96 g/cup', 192, null, null, 7),
  ('comp-almond-croissant-bars', 'light-brown-sugar', '1 tbsp', 'crumble · ≈12 g', 12, null, null, 8),
  ('comp-almond-croissant-bars', 'sliced-almonds', '1/2 cup', '≈46 g · unpriced', 46, null, null, 9),
  ('comp-almond-croissant-bars', 'pecans', '1/2 cup', 'chopped · ≈57 g', 57, null, null, 10),
  ('comp-almond-croissant-bars', 'walnuts', '1/2 cup', 'chopped · ≈58 g', 58, null, null, 11),
  ('comp-almond-croissant-bars', 'powdered-sugar', '2 tbsp', 'dusting · ≈15 g', 15, null, null, 12);

insert into menu_items (
  id, name, brand_name, flavor_tag, is_primary, is_placeholder, publish_to_site,
  assembly_notes, category, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct
)
values (
  'mi-almond-croissant-bars',
  'Almond Croissant Bars',
  'Almond Croissant Bars',
  'almond-croissant-bars',
  false, false, true,
  null,
  'dough', 9, 'bars', null, null, null
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

delete from menu_item_components where menu_item_id = 'mi-almond-croissant-bars';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-almond-croissant-bars', 'comp-almond-croissant-bars', 1, 0);

-- ---------------------------------------------------------------------------
-- 5. Pumpkin Brownies
-- ---------------------------------------------------------------------------
insert into item_components (id, name, category, yield_amount, yield_unit, notes)
values (
  'comp-pumpkin-brownies',
  'Pumpkin Brownies',
  'dough',
  9,
  'bars',
  'Recime · Pumpkin Brownie · 8x8 swirl · 350°F 45–48 min · PDF serves 9'
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;

delete from component_lines where component_id = 'comp-pumpkin-brownies';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-pumpkin-brownies', 'all-purpose-flour', '3/4 cup', '≈90 g', 90, null, null, 0),
  ('comp-pumpkin-brownies', 'baking-powder', '1/2 tsp', null, null, null, 0.5, 1),
  ('comp-pumpkin-brownies', 'kosher-salt', '1/2 tsp', null, null, null, 0.5, 2),
  ('comp-pumpkin-brownies', 'unsalted-butter', '3/4 cup', 'melted · PDF says butter · ≈170 g', 170, null, null, 3),
  ('comp-pumpkin-brownies', 'granulated-sugar', '1 1/2 cups', '≈300 g', 300, null, null, 4),
  ('comp-pumpkin-brownies', 'mexican-vanilla-extract', '2 tsp', null, null, null, 2, 5),
  ('comp-pumpkin-brownies', 'eggs', '3 ea', null, null, 3, null, 6),
  ('comp-pumpkin-brownies', 'dutch-cocoa-powder', '1/4 cup', 'PDF says cocoa powder · ≈20 g', 20, null, null, 7),
  ('comp-pumpkin-brownies', 'semi-sweet-chocolate-chips', '1/2 cup', '≈85 g', 85, null, null, 8),
  ('comp-pumpkin-brownies', 'pumpkin-puree', '1/2 cup', '≈100 g', 100, null, null, 9),
  ('comp-pumpkin-brownies', 'walnuts', '1/2 cup', 'chopped · ≈58 g', 58, null, null, 10),
  ('comp-pumpkin-brownies', 'cinnamon', '3/4 tsp', null, null, null, 0.75, 11),
  ('comp-pumpkin-brownies', 'cloves', '1/2 tsp', null, null, null, 0.5, 12),
  ('comp-pumpkin-brownies', 'nutmeg', '1/2 tsp', null, null, null, 0.5, 13);

insert into menu_items (
  id, name, brand_name, flavor_tag, is_primary, is_placeholder, publish_to_site,
  assembly_notes, category, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct
)
values (
  'mi-pumpkin-brownies',
  'Pumpkin Brownies',
  'Pumpkin Brownies',
  'pumpkin-brownies',
  false, false, true,
  null,
  'dough', 9, 'bars', null, null, null
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

delete from menu_item_components where menu_item_id = 'mi-pumpkin-brownies';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-pumpkin-brownies', 'comp-pumpkin-brownies', 1, 0);

-- ---------------------------------------------------------------------------
-- 6. Powdered sugar glaze (component only — no lemon pound cake PDF)
-- ---------------------------------------------------------------------------
insert into item_components (id, name, category, yield_amount, yield_unit, notes)
values (
  'comp-powdered-sugar-glaze',
  'Powdered Sugar Glaze',
  'topping',
  1,
  'batch',
  'Recime · Powdered Sugar Glaze · component only · ingredients say water; instructions say milk · not linked (no iced lemon pound cake PDF)'
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;

delete from component_lines where component_id = 'comp-powdered-sugar-glaze';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-powdered-sugar-glaze', 'powdered-sugar', '2 cups', '≈240 g', 240, null, null, 0),
  ('comp-powdered-sugar-glaze', 'mexican-vanilla-extract', '1 tsp', null, null, null, 1, 1),
  ('comp-powdered-sugar-glaze', 'water', '1 tbsp', 'range 1–2 tbsp · ≈15 g', 15, null, null, 2);

-- ---------------------------------------------------------------------------
-- 7. Pumpkin Spice Buttermilk Cake, wrapped as Pumpkin Brown Butter Cake
-- ---------------------------------------------------------------------------
insert into item_components (id, name, category, yield_amount, yield_unit, notes)
values (
  'comp-pumpkin-spice-buttermilk-cake',
  'Pumpkin Spice Buttermilk Cake',
  'cake',
  1,
  'cake',
  'Recime · Pumpkin Spice Buttermilk Cake · ounces converted · decorating steps (cream cheese frosting, marzipan) are a different card and were not imported'
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;

delete from component_lines where component_id = 'comp-pumpkin-spice-buttermilk-cake';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-pumpkin-spice-buttermilk-cake', 'all-purpose-flour', '18 oz', '510 g', 510, null, null, 0),
  ('comp-pumpkin-spice-buttermilk-cake', 'baking-soda', '2 tsp', null, null, null, 2, 1),
  ('comp-pumpkin-spice-buttermilk-cake', 'baking-powder', '2 tsp', null, null, null, 2, 2),
  ('comp-pumpkin-spice-buttermilk-cake', 'cinnamon', '1 tbsp', null, null, null, 3, 3),
  ('comp-pumpkin-spice-buttermilk-cake', 'cloves', '1 tsp', null, null, null, 1, 4),
  ('comp-pumpkin-spice-buttermilk-cake', 'nutmeg', '2 tsp', null, null, null, 2, 5),
  ('comp-pumpkin-spice-buttermilk-cake', 'ginger', '1/2 tsp', null, null, null, 0.5, 6),
  ('comp-pumpkin-spice-buttermilk-cake', 'kosher-salt', '1 1/2 tsp', null, null, null, 1.5, 7),
  ('comp-pumpkin-spice-buttermilk-cake', 'eggs', '8 ea', 'large, room temperature', null, 8, null, 8),
  ('comp-pumpkin-spice-buttermilk-cake', 'granulated-sugar', '14 oz', '397 g', 397, null, null, 9),
  ('comp-pumpkin-spice-buttermilk-cake', 'light-brown-sugar', '3 oz', '85 g', 85, null, null, 10),
  ('comp-pumpkin-spice-buttermilk-cake', 'pumpkin-puree', '15 oz', '425 g', 425, null, null, 11),
  ('comp-pumpkin-spice-buttermilk-cake', 'avocado-oil', '4 oz', '113 g', 113, null, null, 12),
  ('comp-pumpkin-spice-buttermilk-cake', 'mexican-vanilla-extract', '1 tbsp', null, null, null, 3, 13),
  ('comp-pumpkin-spice-buttermilk-cake', 'buttermilk', '5 oz', '142 g · or milk + 1 tbsp vinegar', 142, null, null, 14);

insert into menu_items (
  id, name, brand_name, flavor_tag, is_primary, is_placeholder, publish_to_site,
  assembly_notes, category, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct
)
values (
  'mi-pumpkin-brown-butter-cake',
  'Pumpkin Spice Buttermilk Cake with Browned Butter Buttercream',
  'Pumpkin Brown Butter Cake',
  'pumpkin-brown-butter-cake',
  false, false, true,
  'Pumpkin Spice Buttermilk Cake + Browned Butter Buttercream (No CC)',
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

delete from menu_item_components where menu_item_id = 'mi-pumpkin-brown-butter-cake';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-pumpkin-brown-butter-cake', 'comp-pumpkin-spice-buttermilk-cake', 1, 0),
  ('mi-pumpkin-brown-butter-cake', 'comp-browned-butter-buttercream-no-cc', 1, 1);

-- ---------------------------------------------------------------------------
-- 8. Chocolate cake wrapped like the apple spice brown-butter cake
-- ---------------------------------------------------------------------------
insert into menu_items (
  id, name, brand_name, flavor_tag, is_primary, is_placeholder, publish_to_site,
  assembly_notes, category, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct
)
values (
  'mi-chocolate-brown-butter-cake',
  'Chocolate Cake with Browned Butter Buttercream',
  'Chocolate Brown Butter Cake',
  'chocolate-brown-butter-cake',
  false, false, true,
  'Chocolate Cake + Browned Butter Buttercream (No CC)',
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

delete from menu_item_components where menu_item_id = 'mi-chocolate-brown-butter-cake';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-chocolate-brown-butter-cake', 'comp-chocolate-cake', 1, 0),
  ('mi-chocolate-brown-butter-cake', 'comp-browned-butter-buttercream-no-cc', 1, 1);

-- ---------------------------------------------------------------------------
-- 9. Customer-facing names for existing library items
-- ---------------------------------------------------------------------------
update menu_items
set brand_name = 'Apple Spice Brown Butter Cake'
where id = 'mi-apple-spice-cake-bb-bc';

update menu_items
set brand_name = 'Chocolate Chip Banana Bread'
where id = 'mi-of-banana-bread';

-- ---------------------------------------------------------------------------
-- 10. Publish lineup (replace) — union of Wednesday + Saturday
-- Iced Lemon Pound Cake is omitted: no cake PDF, only the glaze above.
-- ---------------------------------------------------------------------------
update menu_items set publish_to_site = true
where id in (
  'mi-pumpkin-brown-butter-cake',
  'mi-pumpkin-brownies',
  'mi-bb-rice-crispy-treats',
  'mi-bb-cc-cookies',
  'mi-apple-spice-cake-bb-bc',
  'mi-chocolate-brown-butter-cake',
  'mi-almond-croissant-bars',
  'mi-of-banana-bread',
  'mi-brown-butter-maple-pecan-cookies'
);

update menu_items set publish_to_site = false
where id not in (
  'mi-pumpkin-brown-butter-cake',
  'mi-pumpkin-brownies',
  'mi-bb-rice-crispy-treats',
  'mi-bb-cc-cookies',
  'mi-apple-spice-cake-bb-bc',
  'mi-chocolate-brown-butter-cake',
  'mi-almond-croissant-bars',
  'mi-of-banana-bread',
  'mi-brown-butter-maple-pecan-cookies'
);

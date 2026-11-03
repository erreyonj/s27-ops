-- Live-DB migration: PDF recipe import (updates + new recipes).
-- Run in Supabase SQL Editor after prior migrations.

-- New ingredients (unpriced until Library)
insert into raw_ingredients (id, name, category, base_unit, suggested_store, package_size, round_to, round_label, pack_price, pack_qty, pack_qty_unit)
values ('gelatin', 'Gelatin', 'other', 'g', null, null, null, null, null, null, null)
on conflict (id) do update set name = excluded.name, category = excluded.category, base_unit = excluded.base_unit;
insert into raw_ingredients (id, name, category, base_unit, suggested_store, package_size, round_to, round_label, pack_price, pack_qty, pack_qty_unit)
values ('dried-apple-rings', 'Dried Apple Rings', 'produce', 'g', null, null, null, null, null, null, null)
on conflict (id) do update set name = excluded.name, category = excluded.category, base_unit = excluded.base_unit;
insert into raw_ingredients (id, name, category, base_unit, suggested_store, package_size, round_to, round_label, pack_price, pack_qty, pack_qty_unit)
values ('toffee-bits', 'Toffee Bits', 'other', 'g', null, null, null, null, null, null, null)
on conflict (id) do update set name = excluded.name, category = excluded.category, base_unit = excluded.base_unit;
insert into raw_ingredients (id, name, category, base_unit, suggested_store, package_size, round_to, round_label, pack_price, pack_qty, pack_qty_unit)
values ('unsweetened-baking-chocolate', 'Unsweetened Baking Chocolate', 'flavor', 'g', null, null, null, null, null, null, null)
on conflict (id) do update set name = excluded.name, category = excluded.category, base_unit = excluded.base_unit;

-- BB CC Cookies
insert into item_components (id, name, type, yield_amount, yield_unit, notes)
values ('comp-bb-cc-cookies', 'BB CC Cookies', 'dough', 6, 'cookies', 'Recime · Browned Butter Chocolate Chip (Levain). Scoop 5–6 oz.')
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;
delete from component_lines where component_id = 'comp-bb-cc-cookies';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-bb-cc-cookies', 'all-purpose-flour', '2 cups', '285 g', 285, null, null, 0),
  ('comp-bb-cc-cookies', 'corn-starch', '2 tsp', null, 5, null, null, 1),
  ('comp-bb-cc-cookies', 'baking-powder', '1/4 tsp', null, null, null, 0.25, 2),
  ('comp-bb-cc-cookies', 'baking-soda', '3/4 tsp', null, null, null, 0.75, 3),
  ('comp-bb-cc-cookies', 'kosher-salt', '1 tsp', null, null, null, 1, 4),
  ('comp-bb-cc-cookies', 'unsalted-butter', '1 cup', '2 sticks, browned · 226 g', 226, null, null, 5),
  ('comp-bb-cc-cookies', 'light-brown-sugar', '3/4 cup', '150 g packed', 150, null, null, 6),
  ('comp-bb-cc-cookies', 'granulated-sugar', '3 Tbsp', '38 g', 38, null, null, 7),
  ('comp-bb-cc-cookies', 'eggs', '1 ea + 1 yolk', '1 large egg + 1 yolk', null, 2, null, 8),
  ('comp-bb-cc-cookies', 'mexican-vanilla-extract', '1 tsp', null, null, null, 1, 9),
  ('comp-bb-cc-cookies', 'milk-chocolate-chips', '100 g', 'milk / semi-sweet blend', 100, null, null, 10),
  ('comp-bb-cc-cookies', 'semi-sweet-chocolate-chips', '100 g', null, 100, null, null, 11);

-- BB Rice Crispy Treats
insert into item_components (id, name, type, yield_amount, yield_unit, notes)
values ('comp-bb-rice-crispy-treats', 'BB Rice Crispy Treats', 'other', 12, 'treats', 'Recime · Brown Butter Rice Crispy Treats · 9x13 pan')
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;
delete from component_lines where component_id = 'comp-bb-rice-crispy-treats';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-bb-rice-crispy-treats', 'unsalted-butter', '2 sticks', '226 g', 226, null, null, 0),
  ('comp-bb-rice-crispy-treats', 'mini-marshmallows', '2 10-oz bags', '566 g', 566, null, null, 1),
  ('comp-bb-rice-crispy-treats', 'mexican-vanilla-extract', '1 tsp', null, null, null, 1, 2),
  ('comp-bb-rice-crispy-treats', 'kosher-salt', '1/2 tsp', null, null, null, 0.5, 3),
  ('comp-bb-rice-crispy-treats', 'crispy-rice-cereal', '9 cups', '225 g', 225, null, null, 4);

-- Chocolate Cake
insert into item_components (id, name, type, yield_amount, yield_unit, notes)
values ('comp-chocolate-cake', 'Chocolate Cake', 'cake', 1, 'cake', 'Recime · The Chocolate Cake · three 7-in tins')
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;
delete from component_lines where component_id = 'comp-chocolate-cake';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-chocolate-cake', 'all-purpose-flour', '365 g', null, 365, null, null, 0),
  ('comp-chocolate-cake', 'dark-brown-sugar', '600 g', null, 600, null, null, 1),
  ('comp-chocolate-cake', 'dutch-cocoa-powder', '120 g', null, 120, null, null, 2),
  ('comp-chocolate-cake', 'baking-soda', '2.5 tsp', '≈15 g', null, null, 2.5, 3),
  ('comp-chocolate-cake', 'kosher-salt', '1 tsp', null, null, null, 1, 4),
  ('comp-chocolate-cake', 'unsalted-butter', '250 g', 'room temperature', 250, null, null, 5),
  ('comp-chocolate-cake', 'espresso-powder', '1 tsp', 'or 30 g espresso shot', null, null, 1, 6),
  ('comp-chocolate-cake', 'water', '370 g', 'warm', 370, null, null, 7),
  ('comp-chocolate-cake', 'eggs', '4 ea', 'large', null, 4, null, 8),
  ('comp-chocolate-cake', 'avocado-oil', '120 g', null, 120, null, null, 9),
  ('comp-chocolate-cake', 'mexican-vanilla-extract', '2 tsp', null, null, null, 2, 10),
  ('comp-chocolate-cake', 'buttermilk', '260 g', null, 260, null, null, 11);

-- OF Banana Bread
insert into item_components (id, name, type, yield_amount, yield_unit, notes)
values ('comp-of-banana-bread', 'OF Banana Bread', 'dough', 8, 'slices', 'Recime · Oat Flour Banana Bread · 1 loaf / 8 slices')
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;
delete from component_lines where component_id = 'comp-of-banana-bread';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-of-banana-bread', 'eggs', '2 ea', 'room temperature', null, 2, null, 0),
  ('comp-of-banana-bread', 'bananas', '1 cup mashed', 'about 2–3 spotty bananas', null, 3, null, 1),
  ('comp-of-banana-bread', 'coconut-oil', '1/2 cup', 'melted; sub half with 1/4 c applesauce', null, null, 24, 2),
  ('comp-of-banana-bread', 'maple-syrup', '1/2 cup', null, null, null, 24, 3),
  ('comp-of-banana-bread', 'coconut-sugar', '1/2 cup', '96 g', 96, null, null, 4),
  ('comp-of-banana-bread', 'mexican-vanilla-extract', '1 tsp', null, null, null, 1, 5),
  ('comp-of-banana-bread', 'oat-flour', '2 cups', '240 g spooned & leveled', 240, null, null, 6),
  ('comp-of-banana-bread', 'baking-soda', '1 tsp', null, null, null, 1, 7),
  ('comp-of-banana-bread', 'baking-powder', '3/4 tsp', null, null, null, 0.75, 8),
  ('comp-of-banana-bread', 'kosher-salt', '1/2 tsp', null, null, null, 0.5, 9),
  ('comp-of-banana-bread', 'cinnamon', '1 tsp', null, null, null, 1, 10),
  ('comp-of-banana-bread', 'mini-chocolate-chips', '1/2 cup', '85 g', 85, null, null, 11);

-- Browned Butter Buttercream (No Cream Cheese)
insert into item_components (id, name, type, yield_amount, yield_unit, notes)
values ('comp-browned-butter-buttercream-no-cc', 'Browned Butter Buttercream (No Cream Cheese)', 'frosting', 1, 'batch', 'Recime · Brown Butter Buttercream · water sub for cream')
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;
delete from component_lines where component_id = 'comp-browned-butter-buttercream-no-cc';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-browned-butter-buttercream-no-cc', 'unsalted-butter', '2 cups', '452 g, divided; brown half', 452, null, null, 0),
  ('comp-browned-butter-buttercream-no-cc', 'mexican-vanilla-extract', '1 tsp', null, null, null, 1, 1),
  ('comp-browned-butter-buttercream-no-cc', 'kosher-salt', '1/2 tsp', 'fine salt', null, null, 0.5, 2),
  ('comp-browned-butter-buttercream-no-cc', 'powdered-sugar', '7 cups', '875 g', 875, null, null, 3),
  ('comp-browned-butter-buttercream-no-cc', 'water', '2 tbs', 'was 1/4 cup cream', 30, null, null, 4);

-- Fluffy Chocolate Frosting
insert into item_components (id, name, type, yield_amount, yield_unit, notes)
values ('comp-fluffy-chocolate-frosting', 'Fluffy Chocolate Frosting', 'frosting', 1, 'batch', 'Recime · Cottage Food Approved')
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;
delete from component_lines where component_id = 'comp-fluffy-chocolate-frosting';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-fluffy-chocolate-frosting', 'unsalted-butter', '2 cups', '4 sticks · 452 g', 452, null, null, 0),
  ('comp-fluffy-chocolate-frosting', 'dutch-cocoa-powder', '1/2 cup', 'unsweetened · ≈40 g', 40, null, null, 1),
  ('comp-fluffy-chocolate-frosting', 'unsweetened-baking-chocolate', '4 oz', '113 g', 113, null, null, 2),
  ('comp-fluffy-chocolate-frosting', 'powdered-sugar', '6 cups', 'sifted · ≈720 g', 720, null, null, 3),
  ('comp-fluffy-chocolate-frosting', 'mexican-vanilla-extract', '1 tsp', null, null, null, 1, 4),
  ('comp-fluffy-chocolate-frosting', 'kosher-salt', 'pinch', '≈1/16 tsp', null, null, 0.06, 5);

-- Fluffy Vanilla Frosting
insert into item_components (id, name, type, yield_amount, yield_unit, notes)
values ('comp-fluffy-vanilla-frosting', 'Fluffy Vanilla Frosting', 'frosting', 1, 'batch', 'Recime · Cottage Food Approved')
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;
delete from component_lines where component_id = 'comp-fluffy-vanilla-frosting';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-fluffy-vanilla-frosting', 'unsalted-butter', '2 cups', '4 sticks · 452 g', 452, null, null, 0),
  ('comp-fluffy-vanilla-frosting', 'powdered-sugar', '6 cups', 'sifted · ≈720 g', 720, null, null, 1),
  ('comp-fluffy-vanilla-frosting', 'mexican-vanilla-extract', '1 tsp', null, null, null, 1, 2),
  ('comp-fluffy-vanilla-frosting', 'kosher-salt', 'pinch', '≈1/16 tsp', null, null, 0.06, 3);

-- Applesauce Spice Cake
insert into item_components (id, name, type, yield_amount, yield_unit, notes)
values ('comp-applesauce-spice-cake', 'Applesauce Spice Cake', 'cake', 1, 'cake', 'Recime · Super Moist Applesauce Spice Cake (no cream cheese BC)')
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;
delete from component_lines where component_id = 'comp-applesauce-spice-cake';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-applesauce-spice-cake', 'unsalted-butter', '4 oz', 'softened · 113 g', 113, null, null, 0),
  ('comp-applesauce-spice-cake', 'granulated-sugar', '10 oz', '283 g', 283, null, null, 1),
  ('comp-applesauce-spice-cake', 'vegetable-oil', '3 oz', '85 g', 85, null, null, 2),
  ('comp-applesauce-spice-cake', 'eggs', '1 ea', 'large, room temperature', null, 1, null, 3),
  ('comp-applesauce-spice-cake', 'cake-flour', '10 oz', '283 g', 283, null, null, 4),
  ('comp-applesauce-spice-cake', 'baking-soda', '1 tsp', null, null, null, 1, 5),
  ('comp-applesauce-spice-cake', 'cloves', '1/8 tsp', null, null, null, 0.125, 6),
  ('comp-applesauce-spice-cake', 'nutmeg', '1/4 tsp', null, null, null, 0.25, 7),
  ('comp-applesauce-spice-cake', 'ginger', '1/4 tsp', null, null, null, 0.25, 8),
  ('comp-applesauce-spice-cake', 'cinnamon', '1 1/2 tsp', null, null, null, 1.5, 9),
  ('comp-applesauce-spice-cake', 'kosher-salt', '1/2 tsp', null, null, null, 0.5, 10),
  ('comp-applesauce-spice-cake', 'applesauce', '12 oz', 'unsweetened · 340 g', 340, null, null, 11),
  ('comp-applesauce-spice-cake', 'mexican-vanilla-extract', '1 tsp', null, null, null, 1, 12);

-- Homemade Marshmallows
insert into item_components (id, name, type, yield_amount, yield_unit, notes)
values ('comp-homemade-marshmallows', 'Homemade Marshmallows', 'other', 20, 'cubes', 'Recime · No corn syrup · 9-in square pan · 20 cubes')
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;
delete from component_lines where component_id = 'comp-homemade-marshmallows';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-homemade-marshmallows', 'gelatin', '1 1/2 tbsp', '≈11 g', 11, null, null, 0),
  ('comp-homemade-marshmallows', 'water', '1 1/2 cups', 'cold, divided · 355 g', 355, null, null, 1),
  ('comp-homemade-marshmallows', 'granulated-sugar', '1 1/2 cups', '300 g', 300, null, null, 2),
  ('comp-homemade-marshmallows', 'powdered-sugar', '1/2 cup', '60 g dusting', 60, null, null, 3),
  ('comp-homemade-marshmallows', 'kosher-salt', '1/4 tsp', null, null, null, 0.25, 4),
  ('comp-homemade-marshmallows', 'mexican-vanilla-extract', '2 tsp', null, null, null, 2, 5);

-- Salted Caramel Apple Cookie
insert into item_components (id, name, type, yield_amount, yield_unit, notes)
values ('comp-salted-caramel-apple-cookie', 'Salted Caramel Apple Cookie', 'dough', 6, 'cookies', 'Recime · Levain-style · salted caramel apple')
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;
delete from component_lines where component_id = 'comp-salted-caramel-apple-cookie';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-salted-caramel-apple-cookie', 'all-purpose-flour', '280 g', '2 1/3 cups', 280, null, null, 0),
  ('comp-salted-caramel-apple-cookie', 'rolled-oats', '180 g', 'old-fashioned · 2 1/4 cups', 180, null, null, 1),
  ('comp-salted-caramel-apple-cookie', 'baking-powder', '2 tsp', null, null, null, 2, 2),
  ('comp-salted-caramel-apple-cookie', 'baking-soda', '1 tsp', null, null, null, 1, 3),
  ('comp-salted-caramel-apple-cookie', 'corn-starch', '1 tsp', '≈2.5 g', 2.5, null, null, 4),
  ('comp-salted-caramel-apple-cookie', 'cinnamon', '3 tsp', null, null, null, 3, 5),
  ('comp-salted-caramel-apple-cookie', 'kosher-salt', '1 tsp', null, null, null, 1, 6),
  ('comp-salted-caramel-apple-cookie', 'unsalted-butter', '227 g', 'cold, cubed · 1 cup', 227, null, null, 7),
  ('comp-salted-caramel-apple-cookie', 'dark-brown-sugar', '220 g', '1 cup packed', 220, null, null, 8),
  ('comp-salted-caramel-apple-cookie', 'granulated-sugar', '70 g', '1/3 cup', 70, null, null, 9),
  ('comp-salted-caramel-apple-cookie', 'eggs', '1 ea + 2 yolks', '1 large + 2 yolks', null, 3, null, 10),
  ('comp-salted-caramel-apple-cookie', 'mexican-vanilla-extract', '1 tbs', null, null, null, 3, 11),
  ('comp-salted-caramel-apple-cookie', 'dried-apple-rings', '150 g', 'soft, finely chopped', 150, null, null, 12),
  ('comp-salted-caramel-apple-cookie', 'toffee-bits', '150 g', 'without chocolate', 150, null, null, 13);

-- menu Applesauce Spice Cake
insert into menu_items (id, name, flavor_tag, is_primary, is_placeholder, publish_to_site, assembly_notes, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct)
values ('mi-applesauce-spice-cake', 'Applesauce Spice Cake', 'applesauce-spice-cake', false, false, false, null, 1, 'cake', null, null, null)
on conflict (id) do update set
  name = excluded.name,
  flavor_tag = excluded.flavor_tag,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  assembly_notes = excluded.assembly_notes;
delete from menu_item_components where menu_item_id = 'mi-applesauce-spice-cake';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-applesauce-spice-cake', 'comp-applesauce-spice-cake', 1, 0);

-- menu Homemade Marshmallows
insert into menu_items (id, name, flavor_tag, is_primary, is_placeholder, publish_to_site, assembly_notes, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct)
values ('mi-homemade-marshmallows', 'Homemade Marshmallows', 'homemade-marshmallows', false, false, false, null, 1, 'cube', null, null, null)
on conflict (id) do update set
  name = excluded.name,
  flavor_tag = excluded.flavor_tag,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  assembly_notes = excluded.assembly_notes;
delete from menu_item_components where menu_item_id = 'mi-homemade-marshmallows';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-homemade-marshmallows', 'comp-homemade-marshmallows', 1, 0);

-- menu Salted Caramel Apple Cookie
insert into menu_items (id, name, flavor_tag, is_primary, is_placeholder, publish_to_site, assembly_notes, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct)
values ('mi-salted-caramel-apple-cookie', 'Salted Caramel Apple Cookie', 'salted-caramel-apple-cookie', false, false, false, null, 1, 'cookie', null, null, null)
on conflict (id) do update set
  name = excluded.name,
  flavor_tag = excluded.flavor_tag,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  assembly_notes = excluded.assembly_notes;
delete from menu_item_components where menu_item_id = 'mi-salted-caramel-apple-cookie';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-salted-caramel-apple-cookie', 'comp-salted-caramel-apple-cookie', 1, 0);

-- menu BB CC Cookies
insert into menu_items (id, name, flavor_tag, is_primary, is_placeholder, publish_to_site, assembly_notes, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct)
values ('mi-bb-cc-cookies', 'BB CC Cookies', 'bb-cc-cookies', false, false, false, null, 1, 'cookie', null, null, null)
on conflict (id) do update set
  name = excluded.name,
  flavor_tag = excluded.flavor_tag,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  assembly_notes = excluded.assembly_notes;
delete from menu_item_components where menu_item_id = 'mi-bb-cc-cookies';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-bb-cc-cookies', 'comp-bb-cc-cookies', 1, 0);

-- menu OF Banana Bread
insert into menu_items (id, name, flavor_tag, is_primary, is_placeholder, publish_to_site, assembly_notes, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct)
values ('mi-of-banana-bread', 'OF Banana Bread', 'of-banana-bread', false, false, false, null, 1, 'slice', null, null, null)
on conflict (id) do update set
  name = excluded.name,
  flavor_tag = excluded.flavor_tag,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  assembly_notes = excluded.assembly_notes;
delete from menu_item_components where menu_item_id = 'mi-of-banana-bread';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-of-banana-bread', 'comp-of-banana-bread', 1, 0);

-- menu BB Rice Crispy Treats
insert into menu_items (id, name, flavor_tag, is_primary, is_placeholder, publish_to_site, assembly_notes, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct)
values ('mi-bb-rice-crispy-treats', 'BB Rice Crispy Treats', 'bb-rice-crispy-treats', false, false, false, null, 1, 'treat', null, null, null)
on conflict (id) do update set
  name = excluded.name,
  flavor_tag = excluded.flavor_tag,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  assembly_notes = excluded.assembly_notes;
delete from menu_item_components where menu_item_id = 'mi-bb-rice-crispy-treats';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-bb-rice-crispy-treats', 'comp-bb-rice-crispy-treats', 1, 0);

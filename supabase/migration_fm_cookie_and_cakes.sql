-- Farmers market cookie costing + cake menu items + apple cake renames.
-- Run in Supabase SQL Editor after prior migrations (incl. category + brand_name).

-- ---------------------------------------------------------------------------
-- 1. Price dried apple rings (Woodman's)
-- ---------------------------------------------------------------------------
update raw_ingredients
set
  suggested_store = 'Woodman''s',
  package_size = '198 g',
  pack_price = 6.79,
  pack_qty = 198,
  pack_qty_unit = 'g',
  base_unit = 'g'
where id = 'dried-apple-rings';

-- ---------------------------------------------------------------------------
-- 2. Homemade toffee component (for salted caramel apple cookie bits)
-- ---------------------------------------------------------------------------
insert into item_components (id, name, category, yield_amount, yield_unit, notes)
values (
  'comp-homemade-toffee',
  'Homemade Toffee',
  'other',
  313,
  'g',
  '1 stick butter + 1 cup light brown sugar + 1 tsp sea salt · break into bits · ≈313 g'
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;

delete from component_lines where component_id = 'comp-homemade-toffee';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-homemade-toffee', 'unsalted-butter', '1 stick', '113 g', 113, null, null, 0),
  ('comp-homemade-toffee', 'light-brown-sugar', '1 cup', '200 g', 200, null, null, 1),
  ('comp-homemade-toffee', 'flaky-sea-salt', '1 tsp', null, null, null, 1, 2);

-- Rewire salted caramel apple cookie: drop purchased toffee-bits line
delete from component_lines
where component_id = 'comp-salted-caramel-apple-cookie'
  and ingredient_id = 'toffee-bits';

update item_components
set notes = 'Recime · Levain-style · salted caramel apple · fold in 150 g homemade toffee bits'
where id = 'comp-salted-caramel-apple-cookie';

update menu_items
set assembly_notes = 'Cookie dough + 150 g homemade toffee bits'
where id = 'mi-salted-caramel-apple-cookie';

delete from menu_item_components where menu_item_id = 'mi-salted-caramel-apple-cookie';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-salted-caramel-apple-cookie', 'comp-salted-caramel-apple-cookie', 1, 0),
  ('mi-salted-caramel-apple-cookie', 'comp-homemade-toffee', 0.479, 1);

-- ---------------------------------------------------------------------------
-- 3. Fluffy vanilla frosting + chocolate addition
-- ---------------------------------------------------------------------------
insert into item_components (id, name, category, yield_amount, yield_unit, notes)
values (
  'comp-fluffy-vanilla-frosting-w-chocolate',
  'Fluffy Vanilla Frosting (w/ Chocolate)',
  'frosting',
  1,
  'batch',
  'Fluffy Vanilla Frosting + 4 oz baking chocolate + 1 tbsp cocoa'
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;

delete from component_lines where component_id = 'comp-fluffy-vanilla-frosting-w-chocolate';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-fluffy-vanilla-frosting-w-chocolate', 'unsalted-butter', '2 cups', '4 sticks · 452 g', 452, null, null, 0),
  ('comp-fluffy-vanilla-frosting-w-chocolate', 'powdered-sugar', '6 cups', 'sifted · ≈720 g', 720, null, null, 1),
  ('comp-fluffy-vanilla-frosting-w-chocolate', 'mexican-vanilla-extract', '1 tsp', null, null, null, 1, 2),
  ('comp-fluffy-vanilla-frosting-w-chocolate', 'kosher-salt', 'pinch', '≈1/16 tsp', null, null, 0.06, 3),
  ('comp-fluffy-vanilla-frosting-w-chocolate', 'unsweetened-baking-chocolate', '4 oz', '113 g', 113, null, null, 4),
  ('comp-fluffy-vanilla-frosting-w-chocolate', 'dutch-cocoa-powder', '1 tbsp', '≈7.5 g', 7.5, null, null, 5);

-- ---------------------------------------------------------------------------
-- 4. Farmers market cake menu items
-- ---------------------------------------------------------------------------
insert into menu_items (
  id, name, brand_name, flavor_tag, is_primary, is_placeholder, publish_to_site,
  assembly_notes, category, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct
)
values (
  'mi-chocolate-cake-fluffy-choc-frosting',
  'Chocolate Cake with Chocolate Frosting',
  'Chocolate Cake with Chocolate Frosting',
  'chocolate-cake-fluffy-choc-frosting',
  false, false, false,
  'Chocolate Cake + Fluffy Vanilla Frosting (w/ Chocolate)',
  'cake', 1, 'cake', null, null, null
)
on conflict (id) do update set
  name = excluded.name,
  brand_name = excluded.brand_name,
  flavor_tag = excluded.flavor_tag,
  assembly_notes = excluded.assembly_notes,
  category = excluded.category,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit;

delete from menu_item_components where menu_item_id = 'mi-chocolate-cake-fluffy-choc-frosting';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-chocolate-cake-fluffy-choc-frosting', 'comp-chocolate-cake', 1, 0),
  ('mi-chocolate-cake-fluffy-choc-frosting', 'comp-fluffy-vanilla-frosting-w-chocolate', 1, 1);

insert into menu_items (
  id, name, brand_name, flavor_tag, is_primary, is_placeholder, publish_to_site,
  assembly_notes, category, yield_amount, yield_unit, labor_hours, margin_pct, discount_pct
)
values (
  'mi-apple-spice-cake-bb-bc',
  'Apple Spice Cake with Browned Butter Buttercream',
  'Apple Spice Cake with Browned Butter Buttercream',
  'apple-spice-cake-bb-bc',
  false, false, false,
  'Apple Spice Cake + Browned Butter Buttercream (No CC)',
  'cake', 1, 'cake', null, null, null
)
on conflict (id) do update set
  name = excluded.name,
  brand_name = excluded.brand_name,
  flavor_tag = excluded.flavor_tag,
  assembly_notes = excluded.assembly_notes,
  category = excluded.category,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit;

delete from menu_item_components where menu_item_id = 'mi-apple-spice-cake-bb-bc';
insert into menu_item_components (menu_item_id, component_id, scale, sort) values
  ('mi-apple-spice-cake-bb-bc', 'comp-applesauce-spice-cake', 1, 0),
  ('mi-apple-spice-cake-bb-bc', 'comp-browned-butter-buttercream-no-cc', 1, 1);

-- ---------------------------------------------------------------------------
-- 5. Rename apple cakes (IDs unchanged)
-- ---------------------------------------------------------------------------
update item_components
set name = 'Apple Spice Cake (w/ Fresh Apples)'
where id = 'comp-apple-cake';

update menu_items
set assembly_notes = 'Apple Spice Cake (w/ Fresh Apples) + BB CC BC + Caramel SauceFilling'
where id = 'mi-danielle';

update item_components
set name = 'Apple Spice Cake'
where id = 'comp-applesauce-spice-cake';

update menu_items
set
  name = 'Apple Spice Cake',
  brand_name = 'Apple Spice Cake',
  flavor_tag = 'apple-spice-cake'
where id = 'mi-applesauce-spice-cake';

-- Vanilla Bean Cream Cheese frosting component (Fluffy Vanilla + vanilla bean paste).
-- Run in Supabase SQL Editor after prior migrations.

insert into item_components (id, name, category, yield_amount, yield_unit, notes)
values (
  'comp-vanilla-bean-cream-cheese',
  'Vanilla Bean Cream Cheese',
  'frosting',
  1,
  'batch',
  'Fluffy Vanilla Frosting with vanilla bean paste'
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  yield_amount = excluded.yield_amount,
  yield_unit = excluded.yield_unit,
  notes = excluded.notes;

delete from component_lines where component_id = 'comp-vanilla-bean-cream-cheese';
insert into component_lines (component_id, ingredient_id, qty_text, detail, grams, count, tsp, sort) values
  ('comp-vanilla-bean-cream-cheese', 'unsalted-butter', '2 cups', '4 sticks · 452 g', 452, null, null, 0),
  ('comp-vanilla-bean-cream-cheese', 'powdered-sugar', '6 cups', 'sifted · ≈720 g', 720, null, null, 1),
  ('comp-vanilla-bean-cream-cheese', 'vanilla-bean-paste', '1 tsp', null, null, null, 1, 2),
  ('comp-vanilla-bean-cream-cheese', 'kosher-salt', 'pinch', '≈1/16 tsp', null, null, 0.06, 3);

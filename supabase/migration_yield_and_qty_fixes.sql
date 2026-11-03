-- Live-DB migration: real component yields + legacy qty/unit fixes.
-- Run in the Supabase SQL Editor on an existing project after seed data is loaded.
-- Convention: component.yield_amount = sellable units one batch covers;
-- menu_items.yield_amount stays 1 (one sellable unit).

-- Cupcake batches: 1 batch → 12 cupcakes
update item_components
set yield_amount = 12, yield_unit = 'cupcakes'
where id in (
  'comp-carrot-cake-cupcakes',
  'comp-chocolate-cupcakes',
  'comp-vanilla-cupcake'
);

-- Cake Builder / cake / frosting / filling components: 1 batch → 1 cake
update item_components
set yield_amount = 1, yield_unit = 'cake'
where yield_unit in ('cake batch', 'batch')
  and type in ('cake', 'frosting', 'filling')
  and id not in (
    'comp-carrot-cake-cupcakes',
    'comp-chocolate-cupcakes',
    'comp-vanilla-cupcake'
  );

-- tbs → tsp (×3) for teaspoon-based ingredients
update component_lines
set tsp = 3
where ingredient_id = 'espresso-powder'
  and qty_text = '1 tbs'
  and tsp = 1;

update component_lines
set tsp = 3
where ingredient_id = 'mexican-vanilla-extract'
  and qty_text = '1 tbs'
  and tsp = 1;

update component_lines
set tsp = 3
where ingredient_id = 'baking-powder'
  and qty_text = '1 tbs'
  and tsp = 1;

-- tbs → grams for dry milk powder (≈7.5 g/tbsp × 2)
update component_lines
set grams = 15
where ingredient_id = 'dry-milk-powder'
  and qty_text = '2 tbs'
  and grams = 2;

-- Chocolate cupcakes: second consecutive baking-soda row was meant to be baking powder.
-- Prefer updating by matching the known duplicate pair on that component.
update component_lines cl
set ingredient_id = 'baking-powder'
where cl.component_id = 'comp-chocolate-cupcakes'
  and cl.ingredient_id = 'baking-soda'
  and cl.sort = 5
  and exists (
    select 1
    from component_lines prev
    where prev.component_id = cl.component_id
      and prev.ingredient_id = 'baking-soda'
      and prev.sort = 4
  );

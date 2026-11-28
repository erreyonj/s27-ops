-- Live-DB migration: sub yield (slices) for whole-item menu entries.
-- Run in the Supabase SQL Editor on an existing project.
--
-- When a menu item has yield_amount = 1 and category cake or pie, the Pricer uses
-- sub_yield (slices) for per-slice suggested retail and per-slice packaging.
-- null = not set; pricing behaves as before (one whole cake / pie).

alter table menu_items add column if not exists sub_yield numeric;

-- Audit (read-only): items with yield 1 and whether they qualify for sub yield.
-- Fill in sub_yield for the qualifying rows, e.g.:
--   update menu_items set sub_yield = 12 where id = 'mi-...';
select
  id,
  name,
  category,
  yield_amount,
  yield_unit,
  sub_yield,
  (category in ('cake', 'pie')) as uses_sub_yield
from menu_items
where yield_amount = 1
order by uses_sub_yield desc, category, name;

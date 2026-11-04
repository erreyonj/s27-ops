-- Live-DB migration: replace item_components.type with public.category enum,
-- add menu_items.category, align menu yields to product-component batch yields,
-- and convert weekly menu quantities from piece counts to batch counts.
-- Run in the Supabase SQL Editor after prior migrations.
-- Assumes public.category enum already exists:
--   cake, frosting, pie, dough, loaf, filling, topping, pudding, other, bars

-- 1. item_components: add category from type, then drop type
alter table item_components
  add column if not exists category public.category;

update item_components
set category = case
  when type in (
    'cake', 'frosting', 'pie', 'dough', 'loaf',
    'filling', 'topping', 'pudding', 'other', 'bars'
  ) then type::public.category
  else 'other'::public.category
end
where category is null;

alter table item_components
  alter column category set default 'other'::public.category;

alter table item_components
  alter column category set not null;

alter table item_components drop column if exists type;

-- 2. menu_items: add category, backfill from product component
alter table menu_items
  add column if not exists category public.category;

-- Product component = first linked component that is not frosting/filling/topping,
-- else the first linked component by sort.
with product as (
  select distinct on (mic.menu_item_id)
    mic.menu_item_id,
    c.category,
    c.yield_amount,
    c.yield_unit
  from menu_item_components mic
  join item_components c on c.id = mic.component_id
  order by
    mic.menu_item_id,
    case when c.category in ('frosting', 'filling', 'topping') then 1 else 0 end,
    mic.sort
)
update menu_items m
set
  category = coalesce(p.category, 'other'::public.category),
  yield_amount = coalesce(p.yield_amount, m.yield_amount),
  yield_unit = coalesce(p.yield_unit, m.yield_unit)
from product p
where p.menu_item_id = m.id;

update menu_items
set category = 'other'::public.category
where category is null;

alter table menu_items
  alter column category set default 'other'::public.category;

alter table menu_items
  alter column category set not null;

-- 3. Convert current_menu_entries.quantity from pieces → batches
--    new_qty = max(1, round(old_qty / yield)) when old_qty > 0 and yield > 1
update current_menu_entries e
set quantity = greatest(
  1,
  round(e.quantity::numeric / nullif(m.yield_amount, 0))::int
)
from menu_items m
where m.id = e.menu_item_id
  and e.quantity > 0
  and m.yield_amount > 1;

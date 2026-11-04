-- Live-DB migration: packaging supplies + per-category packaging kits.
-- Run in the Supabase SQL Editor after category/batch-yield migration.

create table if not exists packaging_supplies (
  id text primary key,
  name text not null,
  pack_price numeric,
  pack_qty numeric,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists category_packaging_lines (
  id bigint generated always as identity primary key,
  category public.category not null,
  supply_id text not null references packaging_supplies (id) on delete cascade,
  qty_per_unit numeric not null default 1,
  sort int not null default 0,
  unique (category, supply_id)
);

alter table packaging_supplies enable row level security;
alter table category_packaging_lines enable row level security;

drop policy if exists "authenticated full access" on packaging_supplies;
create policy "authenticated full access" on packaging_supplies
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on category_packaging_lines;
create policy "authenticated full access" on category_packaging_lines
  for all to authenticated using (true) with check (true);

do $$
begin
  begin
    execute 'alter publication supabase_realtime add table packaging_supplies';
  exception when duplicate_object then null;
  end;
  begin
    execute 'alter publication supabase_realtime add table category_packaging_lines';
  exception when duplicate_object then null;
  end;
end $$;

-- Seed supplies (popup farmers market packs)
insert into packaging_supplies (id, name, pack_price, pack_qty, notes) values
  ('pkg-ingredient-label', '2×3 Ingredient Label', 7.99, 500, 'Roll of 500'),
  ('pkg-brand-label-rounded', 'Thermal Brand Label (Rounded)', 12.99, 150, 'Roll of 150'),
  ('pkg-brand-label-square', 'Thermal Brand Label (Square)', 12.99, 150, 'Roll of 150'),
  ('pkg-cookie-bag', 'Cookie Bag', 9.99, 200, '200 ct'),
  ('pkg-cake-box', 'Cake Box', 32.39, 100, '100 ct')
on conflict (id) do update set
  name = excluded.name,
  pack_price = excluded.pack_price,
  pack_qty = excluded.pack_qty,
  notes = excluded.notes;

-- dough → bag + rounded brand + ingredient (per sellable unit)
delete from category_packaging_lines where category = 'dough';
insert into category_packaging_lines (category, supply_id, qty_per_unit, sort) values
  ('dough', 'pkg-cookie-bag', 1, 0),
  ('dough', 'pkg-brand-label-rounded', 1, 1),
  ('dough', 'pkg-ingredient-label', 1, 2);

-- All other categories → box + square brand + ingredient
delete from category_packaging_lines
where category in (
  'cake', 'frosting', 'pie', 'loaf', 'filling',
  'topping', 'pudding', 'other', 'bars'
);

insert into category_packaging_lines (category, supply_id, qty_per_unit, sort)
select c.cat, s.supply_id, 1, s.sort
from (
  values
    ('cake'::public.category),
    ('frosting'::public.category),
    ('pie'::public.category),
    ('loaf'::public.category),
    ('filling'::public.category),
    ('topping'::public.category),
    ('pudding'::public.category),
    ('other'::public.category),
    ('bars'::public.category)
) as c(cat)
cross join (
  values
    ('pkg-cake-box', 0),
    ('pkg-brand-label-square', 1),
    ('pkg-ingredient-label', 2)
) as s(supply_id, sort);

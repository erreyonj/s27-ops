-- S27 Bakery Ops schema
-- Run this in the Supabase SQL Editor (or `supabase db push`) on a fresh project.

-- Recipe/menu category (distinct from raw_ingredients.category text).
do $$ begin
  create type public.category as enum (
    'cake', 'frosting', 'pie', 'dough', 'loaf',
    'filling', 'topping', 'pudding', 'other', 'bars'
  );
exception when duplicate_object then null;
end $$;

create table if not exists raw_ingredients (
  id text primary key,
  name text not null,
  category text not null default 'other',
  base_unit text not null check (base_unit in ('g', 'count', 'tsp')),
  suggested_store text,
  package_size text,
  -- Rounding buffer for grocery lists: round purchase up to a multiple of this
  -- (in base_unit), e.g. eggs round_to 12 = buy by the dozen.
  round_to numeric,
  round_label text,
  -- Pricing (Section C): price of one purchased pack and how much is in it.
  pack_price numeric,
  pack_qty numeric,
  pack_qty_unit text check (pack_qty_unit in ('g', 'count', 'tsp')),
  created_at timestamptz not null default now()
);

create table if not exists item_components (
  id text primary key,
  name text not null,
  category public.category not null default 'other',
  yield_amount numeric not null default 1, -- units one batch covers (e.g. 12 cupcakes, 6 cookies)
  yield_unit text not null default 'servings',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists component_lines (
  id bigint generated always as identity primary key,
  component_id text not null references item_components (id) on delete cascade,
  ingredient_id text not null references raw_ingredients (id),
  qty_text text not null, -- kitchen display, e.g. "1 3/4 cups"
  detail text, -- secondary display, e.g. "220 g"
  grams numeric, -- per single batch, for weight aggregation
  count numeric, -- per single batch, for count aggregation (eggs, lemons)
  tsp numeric, -- per single batch, for tsp-priced spices/extracts
  sort int not null default 0
);

create table if not exists menu_items (
  id text primary key,
  name text not null,
  -- Customer-facing label (packaging, farmers market). Usually matches name.
  brand_name text not null,
  flavor_tag text,
  is_primary boolean not null default false,
  is_placeholder boolean not null default false,
  assembly_notes text,
  category public.category not null default 'other',
  -- Batch yield of one composed item (Pricer displays retail as $ for yield_amount yield_unit).
  yield_amount numeric not null default 1,
  yield_unit text not null default 'batch',
  -- Pricing calculator (nullable hours; null margin/discount = inherit bakery defaults; 0 = zeroed).
  labor_hours numeric,
  margin_pct numeric,
  discount_pct numeric,
  -- Public farmers market page (brand names via get_public_market_menu).
  publish_to_site boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists bakery_settings (
  id text primary key default 'default',
  hourly_rate numeric not null default 20,
  sales_tax_pct numeric not null default 0,
  default_margin_pct numeric not null default 0.35,
  default_discount_pct numeric not null default 0,
  venmo_fee_pct numeric not null default 0.0229,
  venmo_fee_fixed numeric not null default 0.09,
  updated_at timestamptz not null default now()
);

insert into bakery_settings (id) values ('default') on conflict do nothing;

-- Packaging supplies (bags, boxes, labels) costed like ingredient packs.
create table if not exists packaging_supplies (
  id text primary key,
  name text not null,
  pack_price numeric,
  pack_qty numeric,
  notes text,
  created_at timestamptz not null default now()
);

-- Per-category packaging kit: qty of each supply per sellable unit.
create table if not exists category_packaging_lines (
  id bigint generated always as identity primary key,
  category public.category not null,
  supply_id text not null references packaging_supplies (id) on delete cascade,
  qty_per_unit numeric not null default 1,
  sort int not null default 0,
  unique (category, supply_id)
);

insert into packaging_supplies (id, name, pack_price, pack_qty, notes) values
  ('pkg-ingredient-label', '2×3 Ingredient Label', 7.99, 500, 'Roll of 500'),
  ('pkg-brand-label-rounded', 'Thermal Brand Label (Rounded)', 12.99, 150, 'Roll of 150'),
  ('pkg-brand-label-square', 'Thermal Brand Label (Square)', 12.99, 150, 'Roll of 150'),
  ('pkg-cookie-bag', 'Cookie Bag', 9.99, 200, '200 ct'),
  ('pkg-cake-box', 'Cake Box', 32.39, 100, '100 ct')
on conflict (id) do nothing;

insert into category_packaging_lines (category, supply_id, qty_per_unit, sort) values
  ('dough', 'pkg-cookie-bag', 1, 0),
  ('dough', 'pkg-brand-label-rounded', 1, 1),
  ('dough', 'pkg-ingredient-label', 1, 2)
on conflict (category, supply_id) do nothing;

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
) as s(supply_id, sort)
on conflict (category, supply_id) do nothing;

create table if not exists menu_item_components (
  id bigint generated always as identity primary key,
  menu_item_id text not null references menu_items (id) on delete cascade,
  component_id text not null references item_components (id),
  scale numeric not null default 1,
  sort int not null default 0
);

create table if not exists current_menu (
  id text primary key default 'current',
  week_of date
);

create table if not exists current_menu_entries (
  id bigint generated always as identity primary key,
  menu_id text not null default 'current' references current_menu (id) on delete cascade,
  menu_item_id text not null references menu_items (id) on delete cascade,
  quantity int not null default 0,
  unique (menu_id, menu_item_id)
);

insert into current_menu (id) values ('current') on conflict do nothing;

-- Public market menu RPC: returns only safe fields for published items (anon-callable).
create or replace function get_public_market_menu()
returns table (
  id text,
  name text,
  brand_name text,
  flavor_tag text,
  category public.category,
  yield_unit text
)
language sql
security definer
set search_path = public
as $$
  select m.id, m.name, m.brand_name, m.flavor_tag, m.category, m.yield_unit
  from menu_items m
  where m.publish_to_site
    and not m.is_placeholder
  order by m.brand_name;
$$;

revoke all on function get_public_market_menu() from public;
grant execute on function get_public_market_menu() to anon, authenticated;

-- Row Level Security: single shared login, so any authenticated user has full access.
alter table raw_ingredients enable row level security;
alter table item_components enable row level security;
alter table component_lines enable row level security;
alter table menu_items enable row level security;
alter table menu_item_components enable row level security;
alter table current_menu enable row level security;
alter table current_menu_entries enable row level security;
alter table bakery_settings enable row level security;
alter table packaging_supplies enable row level security;
alter table category_packaging_lines enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'raw_ingredients','item_components','component_lines',
    'menu_items','menu_item_components','current_menu','current_menu_entries',
    'bakery_settings','packaging_supplies','category_packaging_lines'
  ] loop
    execute format('drop policy if exists "authenticated full access" on %I', t);
    execute format(
      'create policy "authenticated full access" on %I for all to authenticated using (true) with check (true)', t
    );
  end loop;
end $$;

-- Realtime for cross-device sync: the menu drives the grocery list, but recipe
-- edits (components/lines/items/ingredients) change it too, so publish all tables.
do $$
declare t text;
begin
  foreach t in array array[
    'raw_ingredients','item_components','component_lines',
    'menu_items','menu_item_components','current_menu','current_menu_entries',
    'bakery_settings','packaging_supplies','category_packaging_lines'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- Tailer Nicole Bakery Ops schema
-- Run this in the Supabase SQL Editor (or `supabase db push`) on a fresh project.

create table if not exists raw_ingredients (
  id text primary key,
  name text not null,
  category text not null default 'other',
  base_unit text not null check (base_unit in ('g', 'count')),
  suggested_store text,
  package_size text,
  -- Rounding buffer for grocery lists: round purchase up to a multiple of this
  -- (in base_unit), e.g. eggs round_to 12 = buy by the dozen.
  round_to numeric,
  round_label text,
  -- Pricing (Section C): price of one purchased pack and how much is in it.
  pack_price numeric,
  pack_qty numeric,
  pack_qty_unit text check (pack_qty_unit in ('g', 'count')),
  created_at timestamptz not null default now()
);

create table if not exists item_components (
  id text primary key,
  name text not null,
  type text not null default 'other', -- cake | frosting | filling | topping | dough | other
  yield_amount numeric not null default 1, -- servings per batch (e.g. 12 cupcakes, frosts 36)
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
  sort int not null default 0
);

create table if not exists menu_items (
  id text primary key,
  name text not null,
  flavor_tag text,
  is_primary boolean not null default false,
  is_placeholder boolean not null default false,
  assembly_notes text,
  created_at timestamptz not null default now()
);

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

-- Row Level Security: single shared login, so any authenticated user has full access.
alter table raw_ingredients enable row level security;
alter table item_components enable row level security;
alter table component_lines enable row level security;
alter table menu_items enable row level security;
alter table menu_item_components enable row level security;
alter table current_menu enable row level security;
alter table current_menu_entries enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'raw_ingredients','item_components','component_lines',
    'menu_items','menu_item_components','current_menu','current_menu_entries'
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
    'menu_items','menu_item_components','current_menu','current_menu_entries'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

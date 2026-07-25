-- Live-DB migration: bakery settings + menu item yield / pricing fields.
-- Run in the Supabase SQL Editor on an existing project.

alter table menu_items add column if not exists yield_amount numeric not null default 1;
alter table menu_items add column if not exists yield_unit text not null default 'batch';
alter table menu_items add column if not exists labor_hours numeric;
alter table menu_items add column if not exists margin_pct numeric;
alter table menu_items add column if not exists discount_pct numeric;

create table if not exists bakery_settings (
  id text primary key default 'default',
  hourly_rate numeric not null default 20,
  sales_tax_pct numeric not null default 0,
  default_margin_pct numeric not null default 0.35,
  default_discount_pct numeric not null default 0,
  updated_at timestamptz not null default now()
);

insert into bakery_settings (id) values ('default') on conflict do nothing;

alter table bakery_settings enable row level security;
drop policy if exists "authenticated full access" on bakery_settings;
create policy "authenticated full access" on bakery_settings
  for all to authenticated using (true) with check (true);

do $$
begin
  alter publication supabase_realtime add table bakery_settings;
exception when duplicate_object then null;
end $$;

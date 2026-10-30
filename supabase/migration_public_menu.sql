-- Public market menu: publish flag + anon-safe RPC (names only).
-- Run in Supabase SQL Editor after schema.sql / prior migrations.

alter table menu_items
  add column if not exists publish_to_site boolean not null default false;

create or replace function get_public_market_menu()
returns table (
  id text,
  name text,
  flavor_tag text
)
language sql
security definer
set search_path = public
as $$
  select m.id, m.name, m.flavor_tag
  from menu_items m
  where m.publish_to_site
    and not m.is_placeholder
  order by m.name;
$$;

revoke all on function get_public_market_menu() from public;
grant execute on function get_public_market_menu() to anon, authenticated;

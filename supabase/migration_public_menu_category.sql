-- Expose category + yield_unit on the public farmers market menu RPC.
-- Run in Supabase SQL Editor after migration_brand_name.sql.

drop function if exists get_public_market_menu();

create function get_public_market_menu()
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

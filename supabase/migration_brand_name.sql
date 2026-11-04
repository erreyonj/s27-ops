-- Customer-facing brand names on menu items.
-- Run in Supabase SQL Editor after schema.sql / prior migrations.

alter table menu_items
  add column if not exists brand_name text;

-- Named cakes: "The {Name}"
update menu_items set brand_name = 'The Alina' where id = 'mi-alina';
update menu_items set brand_name = 'The Phoenix' where id = 'mi-phoenix';
update menu_items set brand_name = 'The Shiloh' where id = 'mi-shiloh';
update menu_items set brand_name = 'The Nyla' where id = 'mi-nyla';
update menu_items set brand_name = 'The Qwantese' where id = 'mi-qwantese';
update menu_items set brand_name = 'The Kiana' where id = 'mi-kiana';
update menu_items set brand_name = 'The Danielle' where id = 'mi-danielle';
update menu_items set brand_name = 'The Bria' where id = 'mi-bria';
update menu_items set brand_name = 'The Jamie' where id = 'mi-jamie';
update menu_items set brand_name = 'The Tierra' where id = 'mi-tierra';
update menu_items set brand_name = 'The Kevi' where id = 'mi-kevi';
update menu_items set brand_name = 'The Tai' where id = 'mi-tai';
update menu_items set brand_name = 'The Daneen' where id = 'mi-daneen';
update menu_items set brand_name = 'The Laura-Lee' where id = 'mi-laura-lee';
update menu_items set brand_name = 'The Sade' where id = 'mi-sade';

-- Abbreviation expansions (OF = Oat Flour, BB = Brown Butter, CC context-dependent)
update menu_items set brand_name = 'Oat Flour Peanut Butter Cookies' where id = 'mi-of-pb-cookies';
update menu_items set brand_name = 'Oat Flour Banana Bread' where id = 'mi-of-banana-bread';
update menu_items set brand_name = 'Chocolate Chip Cookie' where id = 'mi-cc-cookie';
update menu_items set brand_name = 'Brown Butter Chocolate Chip Cookies' where id = 'mi-bb-cc-cookies';
update menu_items set brand_name = 'Double Chocolate Peanut Butter Cookies' where id = 'mi-double-cc-pb-cookies';
update menu_items set brand_name = 'Cinnamon Rolls with Cream Cheese Buttercream' where id = 'mi-cinnamon-rolls-w-ccbc';
update menu_items set brand_name = 'Cinnamon Rolls with Brown Butter Cream Cheese Buttercream' where id = 'mi-cinnamon-rolls-w-bbccbc';
update menu_items set brand_name = 'Brown Butter Banana Pudding' where id = 'mi-bb-banana-pudding';
update menu_items set brand_name = 'Biscoff Brown Butter Banana Pudding' where id = 'mi-biscoff-bb-banana-pudding';
update menu_items set brand_name = 'Brown Butter Rice Crispy Treats' where id = 'mi-bb-rice-crispy-treats';
update menu_items set brand_name = 'Chocolate Peanut Butter Cup Pie' where id = 'mi-choc-pb-cup-pie';

-- Default: brand name matches internal name
update menu_items set brand_name = name where brand_name is null;

alter table menu_items
  alter column brand_name set not null;

-- Recreate public RPC to include brand_name (return type change requires drop).
drop function if exists get_public_market_menu();

create function get_public_market_menu()
returns table (
  id text,
  name text,
  brand_name text,
  flavor_tag text
)
language sql
security definer
set search_path = public
as $$
  select m.id, m.name, m.brand_name, m.flavor_tag
  from menu_items m
  where m.publish_to_site
    and not m.is_placeholder
  order by m.brand_name;
$$;

revoke all on function get_public_market_menu() from public;
grant execute on function get_public_market_menu() to anon, authenticated;

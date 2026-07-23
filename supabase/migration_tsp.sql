-- Live-DB migration: add tsp as a base unit and component_lines.tsp.
-- Run in the Supabase SQL Editor on an existing project (schema.sql is for fresh installs).

alter table raw_ingredients drop constraint if exists raw_ingredients_base_unit_check;
alter table raw_ingredients
  add constraint raw_ingredients_base_unit_check
  check (base_unit in ('g', 'count', 'tsp'));

alter table raw_ingredients drop constraint if exists raw_ingredients_pack_qty_unit_check;
alter table raw_ingredients
  add constraint raw_ingredients_pack_qty_unit_check
  check (pack_qty_unit is null or pack_qty_unit in ('g', 'count', 'tsp'));

alter table component_lines add column if not exists tsp numeric;

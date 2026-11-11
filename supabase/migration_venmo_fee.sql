-- Venmo / card pass-through fee on bakery defaults (2.29% + $0.09).
-- Run in Supabase SQL Editor after prior pricing migrations.

alter table bakery_settings
  add column if not exists venmo_fee_pct numeric not null default 0.0229;

alter table bakery_settings
  add column if not exists venmo_fee_fixed numeric not null default 0.09;

update bakery_settings
set
  venmo_fee_pct = coalesce(venmo_fee_pct, 0.0229),
  venmo_fee_fixed = coalesce(venmo_fee_fixed, 0.09)
where id = 'default';

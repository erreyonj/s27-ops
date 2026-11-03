-- Live-DB migration: real per-batch yields for cookies, rolls, bread, bars,
-- treats, pound cake; frosting/BC → 1 batch; Apple Cake rename.
-- Run in the Supabase SQL Editor after prior migrations.

-- Levain-style cookies: 1 batch → 6 cookies
update item_components
set yield_amount = 6, yield_unit = 'cookies'
where id in (
  'comp-bb-cc-cookies',
  'comp-cc-cookie',
  'comp-double-cc-pb-cookies',
  'comp-of-pb-cookies'
);

update menu_items
set yield_unit = 'cookie'
where id in (
  'mi-bb-cc-cookies',
  'mi-cc-cookie',
  'mi-double-cc-pb-cookies',
  'mi-of-pb-cookies'
);

-- Cinnamon rolls: 1 batch → 8 rolls
update item_components
set yield_amount = 8, yield_unit = 'rolls'
where id in (
  'comp-cinnamon-rolls',
  'comp-cinnamon-rolls-w-ccbc',
  'comp-cinnamon-rolls-w-bbccbc'
);

update menu_items
set yield_unit = 'roll'
where id in (
  'mi-cinnamon-rolls',
  'mi-cinnamon-rolls-w-ccbc',
  'mi-cinnamon-rolls-w-bbccbc'
);

-- Banana bread: 1 batch → 8 slices
update item_components
set yield_amount = 8, yield_unit = 'slices'
where id = 'comp-of-banana-bread';

update menu_items
set yield_unit = 'slice'
where id = 'mi-of-banana-bread';

-- Sugar cookie bars: 1 batch → 9 bars
update item_components
set yield_amount = 9, yield_unit = 'bars'
where id = 'comp-sugar-cookie-bars';

update menu_items
set yield_unit = 'bar'
where id = 'mi-sugar-cookie-bars';

-- BB rice crispy treats: 1 batch → 12 treats
update item_components
set yield_amount = 12, yield_unit = 'treats'
where id = 'comp-bb-rice-crispy-treats';

update menu_items
set yield_unit = 'treat'
where id = 'mi-bb-rice-crispy-treats';

-- Pound cake: 1 batch → 16 slices (2 loaves × ~8)
update item_components
set yield_amount = 16, yield_unit = 'slices'
where id = 'comp-pound-cake';

update menu_items
set yield_unit = 'slice'
where id = 'mi-pound-cake';

-- Buttercreams / frostings are components: 1 batch each
update item_components
set yield_amount = 1, yield_unit = 'batch'
where type = 'frosting';

-- Rename Apple Cake (component + assembly notes). Not a standalone menu item.
update item_components
set name = 'Apple Cake (w/ Fresh Apples)'
where id = 'comp-apple-cake';

update menu_items
set assembly_notes = replace(assembly_notes, 'Apple Cake +', 'Apple Cake (w/ Fresh Apples) +')
where assembly_notes like 'Apple Cake +%';

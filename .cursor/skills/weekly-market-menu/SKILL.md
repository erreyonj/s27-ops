---
name: weekly-market-menu
description: >-
  Imports Recime recipe PDFs into s27-ops (ingredients, components, menu items),
  wraps sparse cakes for cottage-food farmers market sale, and updates
  publish_to_site for the weekly market lineup. Use when the user attaches
  Recime PDFs, mentions this week's menu, a market date (e.g. 11/11), farmers
  market lineup, or weekly market menu builds.
---

# Weekly market menu (Recime → S27 Ops)

## When this applies

User attaches recipe PDFs and/or names a market date. Goal: library + public
farmers market names ready. Grocery batch counts stay a separate Menu Builder
step — never invent quantities.

## Request options

Parse from the user message (defaults in parentheses):

| Option | Meaning |
|--------|---------|
| `lineup: replace` (default) | Publish sellable items from this packet; unpublish other `publish_to_site` items |
| `lineup: add` | Only publish new sellable items; leave existing published items |
| `lineup: ops-only` | Import recipes; leave `publish_to_site` alone |
| `buttercream: <name>` | Cake-only PDFs wrap with this frosting component (or attached frosting PDF) instead of the default |

## Workflow

1. **OCR PDFs** — Recime exports are often image-only. OCR pages (e.g. Swift + PDFKit/Vision on macOS). Extract title, serves, and ingredient lines with grams/tsp/count.
2. **Classify each PDF** before writing data:
   - **Frosting / filling / topping** → component only (`yieldAmount` 1, `yieldUnit` `batch`). Never a menu item.
   - **Finished cookie / treat / bar / loaf** → one component + 1:1 menu item.
   - **Cake with frosting named/included** → cake component + frosting component(s) + wrapped menu item.
   - **Cake-only (sparse)** → cake component + **default wrap** (see below). Do not publish a naked cake.
3. **Match existing library** — search `src/data/seed.ts` / live components. Confirm with the user before replacing a formula. Update in place when confirmed.
4. **Sub-recipes** — glaze, streusel, cinnamon sugar that are fully used by one item stay as lines on that component. Split into a separate component only when reused or scaled as a partial batch (homemade toffee pattern).
5. **Write both** `src/data/seed.ts` and a new `supabase/migration_*.sql` (upsert style). User runs SQL in the Supabase SQL editor — not `db push`.
6. **Publish** per `lineup` option. Public site reads `get_public_market_menu` (`publish_to_site`), not `current_menu`.

## Cake wrap (cottage food)

Farmers market cakes are not sold unfrosted.

- **Default:** wrap with `comp-fluffy-vanilla-frosting` (Fluffy Vanilla Frosting, cottage-food approved). Brand name like `{Cake Name} with Vanilla Frosting`.
- **Override:** `buttercream: <name>` or an attached frosting PDF → that component instead. Custom chocolate-on-vanilla additions follow the existing `comp-fluffy-vanilla-frosting-w-chocolate` pattern when the user specifies them.

## Yields and packaging categories

| Product | Default yield | Menu `category` | Packaging kit |
|---------|---------------|-----------------|---------------|
| Levain-style cookie | **6** cookies (ignore PDF "serves 12") | `dough` | bag |
| Layer cake | **1** cake | `cake` | box |
| Slice loaf | PDF **serves** count as slices | `dough` | bag per slice |
| Treat / bar | PDF yield when clear | match product | bag for dough/bars |

Frostings: always 1 batch. Named cakes / brand abbreviations: set `brandName` (customer-facing) separately from internal `name`.

## Ingredients

- Reuse existing ingredient IDs when names match (e.g. `heavy-whipping-cream`, `mexican-vanilla-extract`).
- New ingredients: unpriced (`packPrice` / `pack_price` null) until Library.
- Do not confuse lookalikes (`apple-cider` ≠ `apple-cider-vinegar`).

## Migration shape

Follow recent files (`migration_pdf_recipes.sql`, `migration_fm_cookie_and_cakes.sql`):

1. `insert … on conflict` raw ingredients
2. Components + `delete`/`insert` `component_lines`
3. Menu items with `brand_name`, `category`, yields, `assembly_notes`
4. `menu_item_components` links (scales)
5. `update menu_items set publish_to_site = …` for the lineup

## Checklist before finishing

- [ ] Every PDF classified; sparse cakes wrapped
- [ ] Replacements confirmed when overlapping existing IDs
- [ ] Seed + SQL migration both updated
- [ ] `publish_to_site` matches `lineup` option
- [ ] User told: run migration in SQL editor, set pack prices, set Menu Builder batches

# S27 — Bakery Ops

Menu, recipe, and costing app for Tailer Nicole Wine and Cupcakes (app brand: **S27**).

## Status

**Original scoped plan (M0–M4) is complete.** Follow-on work for the full legacy library and Excel-style pricer is also complete.

| Milestone | Scope | Status |
|-----------|--------|--------|
| **M0** | Vite + React + TS scaffold, Supabase schema, `Repository`, auth + RLS | Done |
| **M1** | Domain model, scaling helpers, seed / Library browse | Done |
| **M2** | Section A Menu Builder + Current Menu + Section D Grocery + Realtime | Done |
| **M3** | Section B MenuItemBuilder (drag ingredients, 2×/3× preview) | Done |
| **M4** | Section C Retail Pricer (cost rollup → suggested retail) | Done |
| **Import** | Full `Legacy-Pricer-Inventory.xlsx` → seed (124 ings / 62 comps / 38 items) | Done |
| **Pricer redesign** | Materials + labor + margin/discount/tax; pack prices in Library | Done |
| **Deploy / auth** | Netlify from `dev`, two named users, sign-ups off (dashboard) | Done |
| **Rebrand** | Tailer Nicole → S27 Ops, repo `s27-ops` | Done |

**Intentionally not built yet** (called out as deferred / out of scope in later plans):

- Offline / IndexedDB mirror for no-signal kitchen use
- Packaging / “Other” cost line from Excel
- Cake size multipliers (Excel Cake Builder `E18`-style)
- Live Google Sheets sync
- Importing per-component labor minutes from the spreadsheet (Pricer uses per–MenuItem `laborHours` instead)
- Self-serve password reset

See `scripts/import-report.md` for import spot-checks and remaining unit-mismatch warnings.

## Features

- **Menu Builder (Section A):** search the recipe DB, review a menu item’s components, submit it to this week’s menu.
- **Current Menu:** the week’s lineup with quantities and component batch counts.
- **Grocery (Section D):** aggregated raw ingredients from the current menu with rounding buffers (eggs by the dozen, butter by the pound), grouped by *suggested* store. Printable and shareable.
- **New Item (Section B):** MenuItemBuilder — compose new items from raw ingredients (drag from the master list) or reuse existing components. How rotating flavors get added.
- **Library:** browse components (1×/2×/3× scaling), menu items, and ingredients. **Editable pack prices** live on the Ingredients tab.
- **Pricer (Section C):** Excel-style quote per MenuItem — materials rollup + labor + margin/discount/tax → suggested retail (`$70/cake`, etc.), with draft/commit overrides and missing-data warnings.

## Domain model

```
RawIngredient → ItemComponent → MenuItem → CurrentMenu → GroceryList
RawIngredient (pack price) + MenuItem (labor/margin/discount) → Pricer quote
```

| Entity | Role |
|--------|------|
| `RawIngredient` | Purchased goods; pack price → unit cost (`g` / `count` / `tsp`) |
| `ItemComponent` | Sub-recipe (cake, frosting, filling, …) with lines |
| `MenuItem` | Finished product = components at scale; yield unit + pricing overrides |
| `CurrentMenu` | This week’s quantities |
| `BakerySettings` | Global hourly rate, tax %, default margin/discount |
| Grocery / Quote | Derived (not stored tables) |

## Stack

Vite + React + TypeScript. Data in Supabase (Postgres + Auth + RLS + Realtime).
Without Supabase keys, the app runs in **demo mode** (seeded, in-memory, nothing saved).

## Pricing formula

```
materials       = ingredient rollup for one MenuItem yield
labor           = laborHours × hourlyRate   (0 if hours missing)
baseCost        = materials + labor
afterMargin     = margin < 1 ? baseCost / (1 - margin) : baseCost
afterDiscount   = afterMargin × (1 - discount)
suggestedRetail = afterDiscount × (1 + tax)
```

- Hourly rate and sales tax are **global** (`bakery_settings`).
- Margin / discount: item override if set, else bakery default. `null` = inherit; `0` = intentionally zeroed.
- Draft changes in the Pricer UI until **Commit to item**; **Zero** buttons set a draft to `0`.

## Setup

1. `npm install`
2. Create a free project at [supabase.com](https://supabase.com).
3. In the Supabase **SQL Editor**, paste and run `supabase/schema.sql`.
   - Existing projects that predate tsp support: also run `supabase/migration_tsp.sql`.
   - Existing projects that predate the pricing redesign: also run `supabase/migration_pricing.sql`.
4. In **Authentication → Users**, add the bakery user(s) (email + password).
5. Copy `.env.example` to `.env` and fill (Settings → API):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (the `sb_publishable_...` key; the legacy anon key also works under `VITE_SUPABASE_ANON_KEY`)
6. `npm run dev`, sign in, then click **Load starter recipes** on the setup screen — seeds the full legacy library from the browser (no service-role key).
   - Alternative: `npm run seed` from the CLI (`SUPABASE_SERVICE_ROLE_KEY` required).

## Legacy Excel import

The recipe/price library is generated from `Legacy-Pricer-Inventory.xlsx` (gitignored):

```bash
npm run import:legacy   # regenerates src/data/seed.ts + scripts/import-report.md
npm run seed            # optional: push seed to Supabase
```

Re-import after Materials/recipe edits in the spreadsheet. Spot-checks and unmatched names are in `scripts/import-report.md`.

## Deploy (Netlify)

1. Netlify → **Add new site → Import an existing project** → GitHub → `s27-ops`.
2. Production branch: `dev`. Build command `npm run build`, publish directory `dist`
   (set by `netlify.toml`, including SPA redirect `/* → /index.html 200`).
3. Site settings → **Environment variables** — from your local `.env` (not from git):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

   Never add `SUPABASE_SERVICE_ROLE_KEY` to Netlify.

4. Deploy, open the site URL, and sign in.

## Harden auth (Supabase dashboard)

Access model: two named users (owner + baker), no public registration. RLS already
gives any authenticated user full access and blocks anonymous ones.

1. **Authentication → Sign In / Providers → Email**: keep Email enabled; turn
   **Allow new users to sign up** OFF. Turn **Confirm email** OFF (or confirm both
   users manually).
2. **Authentication → Users → Add user**: one account for the owner, one for the
   baker.
3. **Authentication → URL Configuration**: set **Site URL** to the Netlify URL
   and add it to Redirect URLs.
4. Locked out? Reset the password from **Authentication → Users**
   (no self-serve reset in the app).

## Smoke test (phone)

Sign in → Menu Builder: add a primary cupcake → Current Menu: bump quantity →
Grocery: check rounding and store grouping → Print. With a second signed-in device,
a quantity change should appear on the other device within a second or two (Realtime).

Pricer: pick a cake flavor → confirm materials breakdown → set labor hours → adjust
margin draft → Commit → suggested retail shows `/cake` (or the item’s yield unit).

## Project layout

```
src/
  domain/     types, scaling, grocery aggregate, quoteMenuItem
  pages/      Menu Builder, Current Menu, Grocery, New Item, Library, Pricer
  repo/       Repository + Supabase + Memory (demo) implementations
  state/      AuthGate, AppState (+ Realtime)
  data/       seed.ts (generated from Excel)
supabase/     schema.sql + incremental migrations
scripts/      import-legacy-xlsx.ts, seed CLI, import-report.md
```

## Notes

- Supabase free tier pauses after ~7 days of inactivity — resume with one click in the dashboard.
- After pulling pricing calculator changes, run `supabase/migration_pricing.sql` if the live DB is older than that migration.
- Demo mode uses the same generated seed as “Load starter recipes”; cloud persistence requires Supabase env keys.

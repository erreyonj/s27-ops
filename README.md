# S27 — Bakery Ops

Menu, recipe and costing app (built for Tailer Nicole Wine and Cupcakes).

- **Menu Builder (Section A):** search the recipe DB, review a menu item's components, submit it to this week's menu.
- **Current Menu:** the week's lineup with quantities and component batch counts.
- **Grocery (Section D):** aggregated raw ingredients from the current menu with rounding buffers (eggs by the dozen, butter by the pound), grouped by *suggested* store. Printable and shareable.
- **New Item (Section B):** MenuItemBuilder — compose new items from raw ingredients (drag from the master list) or reuse existing components. How rotating flavors get added.
- **Library:** browse components (with 1x/2x/3x scaling), menu items and ingredients.
- **Pricer (Section C):** ingredient pack prices roll up to per-unit cost; a margin multiplier suggests retail.

## Stack

Vite + React + TypeScript. Data lives in Supabase (Postgres + Auth + RLS + Realtime).
Without Supabase keys, the app runs in **demo mode** (seeded, in-memory, nothing saved).

## Setup

1. `npm install`
2. Create a free project at [supabase.com](https://supabase.com).
3. In the Supabase **SQL Editor**, paste and run `supabase/schema.sql`.
   - If the project already existed before tsp support, also run `supabase/migration_tsp.sql`.
   - If it existed before the pricing calculator redesign, also run `supabase/migration_pricing.sql`.
4. In **Authentication -> Users**, add the single shared bakery user (email + password).
5. Copy `.env.example` to `.env` and fill (Settings -> API):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (the `sb_publishable_...` key; the legacy anon key also works under `VITE_SUPABASE_ANON_KEY`)
6. `npm run dev`, sign in with the shared account, then click **Load starter recipes**
   on the setup screen — this seeds ingredients, components, and menu items
   straight from the browser (no service-role key needed).
   - Alternative: `npm run seed` from the CLI, which needs `SUPABASE_SERVICE_ROLE_KEY`.

## Legacy Excel import

The full recipe/price library is generated from `Legacy-Pricer-Inventory.xlsx` (gitignored):

```bash
npm run import:legacy   # regenerates src/data/seed.ts + scripts/import-report.md
npm run seed            # optional: push seed to Supabase
```

## Deploy (Netlify)

1. Netlify -> **Add new site -> Import an existing project** -> GitHub -> `s27-ops`.
2. Production branch: `dev`. Build command `npm run build`, publish directory `dist`
   (both already set by `netlify.toml`, which also includes the SPA redirect `/* -> /index.html 200`).
3. Site settings -> **Environment variables** — copy the values from your local `.env` (not from git):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

   Never add `SUPABASE_SERVICE_ROLE_KEY` to Netlify — the browser app must only ever
   see the publishable key.
4. Deploy, open the site URL, and sign in.

## Harden auth (Supabase dashboard)

Access model: two named users (owner + baker), no public registration. RLS already
gives any authenticated user full access and blocks anonymous ones, so this is all
dashboard config — no schema changes.

1. **Authentication -> Sign In / Providers -> Email**: keep Email enabled; turn
   **Allow new users to sign up** OFF. Turn **Confirm email** OFF (or confirm both
   users manually) so no one gets stuck waiting on a verification email.
2. **Authentication -> Users -> Add user**: one account for the owner, one for the
   baker, each with their own password (auto-confirm when creating).
3. **Authentication -> URL Configuration**: set **Site URL** to the Netlify URL
   (e.g. `https://your-site.netlify.app`) and add it to Redirect URLs.
4. Locked out? The owner resets the password from **Authentication -> Users**
   (there is no self-serve reset flow in the app).

## Smoke test (phone)

Sign in -> Menu Builder: add a primary cupcake -> Current Menu: bump quantity ->
Grocery: check rounding and store grouping -> Print. With a second signed-in device,
a quantity change should appear on the other device within a second or two (Realtime).

## Notes

- Supabase free tier pauses after ~7 days of inactivity — resume with one click in the dashboard.
- Re-import the Excel library with `npm run import:legacy` after Materials/recipe edits; see `scripts/import-report.md` for unmatched names and cost spot-checks.
- After pulling pricing calculator changes, run `supabase/migration_pricing.sql` in the SQL Editor (adds `bakery_settings` and menu-item yield/labor/margin/discount columns).

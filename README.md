# Tailer Nicole — Bakery Ops

Menu, recipe and costing app for Tailer Nicole Wine and Cupcakes.

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
4. In **Authentication -> Users**, add the single shared bakery user (email + password).
5. Copy `.env.example` to `.env` and fill (Settings -> API):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (the `sb_publishable_...` key; the legacy anon key also works under `VITE_SUPABASE_ANON_KEY`)
6. `npm run dev`, sign in with the shared account, then click **Load starter recipes**
   on the setup screen — this seeds ingredients, components, and the 3 primary cupcakes
   straight from the browser (no service-role key needed).
   - Alternative: `npm run seed` from the CLI, which needs `SUPABASE_SERVICE_ROLE_KEY`.

## Deploy (Netlify)

Build command `npm run build`, publish directory `dist`. Set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` as environment variables in Netlify. Add a SPA redirect
(`/* -> /index.html 200`) — already included in `netlify.toml`.

## Notes

- The Vanilla Cupcake is seeded as a **placeholder** (derived from the lemon base, no zest). Replace it via the Library/Builder when the real recipe is uploaded.
- Supabase free tier pauses after ~7 days of inactivity — resume with one click in the dashboard.
- The Excel cost spreadsheet can later be mapped into the Pricer's ingredient price table.

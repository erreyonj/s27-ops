import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { AppStateProvider, useApp } from "./state/AppState";
import { AuthGate } from "./state/AuthGate";
import { getSupabase, supabaseConfigured } from "./lib/supabase";
import { MenuBuilderPage } from "./pages/MenuBuilderPage";
import { CurrentMenuPage } from "./pages/CurrentMenuPage";
import { GroceryPage } from "./pages/GroceryPage";
import { ItemBuilderPage } from "./pages/ItemBuilderPage";
import { LibraryPage } from "./pages/LibraryPage";
import { PricerPage } from "./pages/PricerPage";

const LINKS = [
  { to: "/", label: "Menu Builder" },
  { to: "/current-menu", label: "Current Menu" },
  { to: "/grocery", label: "Grocery" },
  { to: "/new-item", label: "New Item" },
  { to: "/library", label: "Library" },
  { to: "/pricer", label: "Pricer" },
];

function SetupPrompt() {
  const { repo, refresh } = useApp();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function seed() {
    setBusy(true);
    setErr(null);
    try {
      await repo.seedStarterData();
      await refresh();
    } catch (e: any) {
      setErr(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ textAlign: "center" }}>
      <p className="eyebrow">One-time setup</p>
      <h2>Your database is connected but empty.</h2>
      <p className="muted">
        Load the full legacy library (priced ingredients, recipe components, cake
        flavors, and products) into your Supabase project.
      </p>
      <button className="btn" onClick={seed} disabled={busy}>
        {busy ? "Loading starter data…" : "Load starter recipes"}
      </button>
      {err && (
        <p className="error-text" style={{ marginTop: 10 }}>
          {err} — make sure you ran <code>supabase/schema.sql</code> (and{" "}
          <code>supabase/migration_tsp.sql</code> /{" "}
          <code>supabase/migration_pricing.sql</code> on existing projects) in the SQL
          editor first.
        </p>
      )}
    </div>
  );
}

function SignOutButton() {
  if (!supabaseConfigured) return null;
  return (
    <button
      className="btn ghost sm no-print"
      onClick={() => getSupabase().auth.signOut()}
    >
      Sign out
    </button>
  );
}

function Shell() {
  const { data, loading, error } = useApp();
  const needsSetup = Boolean(supabaseConfigured && data && data.ingredients.length === 0);

  return (
    <>
      {!supabaseConfigured && (
        <div className="demo-banner no-print">
          Demo mode — changes are not saved to the cloud. Fill in .env with your
          Supabase keys (see README) to go live.
        </div>
      )}
      <nav className="site-nav no-print">
        <div className="nav-inner">
          <NavLink to="/" className="nav-logo">
            <span>S27</span> Ops
          </NavLink>
          <div className="nav-links">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {l.label}
              </NavLink>
            ))}
            <SignOutButton />
          </div>
        </div>
      </nav>
      <main className="page">
        <div className="container">
          {loading && <p className="muted">Loading…</p>}
          {error && <p className="error-text">Couldn’t load data: {error}</p>}
          {data && needsSetup && <SetupPrompt />}
          {data && !needsSetup && (
            <Routes>
              <Route path="/" element={<MenuBuilderPage />} />
              <Route path="/current-menu" element={<CurrentMenuPage />} />
              <Route path="/grocery" element={<GroceryPage />} />
              <Route path="/new-item" element={<ItemBuilderPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/pricer" element={<PricerPage />} />
            </Routes>
          )}
        </div>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthGate>
      <AppStateProvider>
        <Shell />
      </AppStateProvider>
    </AuthGate>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../state/AppState";
import { CATEGORIES, type Category, type ItemComponent, type MenuItem } from "../domain/types";

function ComponentCard({ comp, scale }: { comp: ItemComponent; scale: number }) {
  const { data } = useApp();
  const ingName = (id: string) =>
    data!.ingredients.find((i) => i.id === id)?.name ?? id.replace(/-/g, " ");
  return (
    <div className="component-card">
      <p className="eyebrow">{comp.category}</p>
      <h3>{comp.name}</h3>
      <p className="note-inline">
        1 batch → {comp.yieldAmount} {comp.yieldUnit}
        {scale !== 1 && ` · used at ${scale}× per batch`}
      </p>
      <ul>
        {comp.lines.map((l, i) => (
          <li key={i}>
            <strong>{l.qtyText}</strong> {l.detail ? <span className="muted">({l.detail})</span> : null}{" "}
            — {ingName(l.ingredientId)}
          </li>
        ))}
      </ul>
      {comp.notes && <p className="note-inline" style={{ marginTop: 10 }}>{comp.notes}</p>}
    </div>
  );
}

function MenuItemReview({ item }: { item: MenuItem }) {
  const { data, repo, refresh } = useApp();
  const [qty, setQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState(false);

  const compById = useMemo(
    () => new Map(data!.components.map((c) => [c.id, c])),
    [data]
  );
  const existing = data!.menu.entries.find((e) => e.menuItemId === item.id);

  async function submit() {
    setSaving(true);
    try {
      const total = (existing?.quantity ?? 0) + qty;
      await repo.setMenuQuantity(item.id, total);
      await refresh();
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>{item.name}</h2>
        <span className="pill">{item.category}</span>
        {item.isPrimary && <span className="pill rose">primary</span>}
        {item.isPlaceholder && <span className="pill warn">placeholder recipe</span>}
        {existing && (
          <span className="note-inline">on this week’s menu: {existing.quantity} batch{existing.quantity === 1 ? "" : "es"}</span>
        )}
      </div>
      <p className="note-inline">
        1 batch → {item.yieldAmount} {item.yieldUnit}
      </p>
      {item.assemblyNotes && <p className="note-inline">{item.assemblyNotes}</p>}

      <div className="component-scroller">
        {item.components.map((ref) => {
          const comp = compById.get(ref.componentId);
          return comp ? (
            <ComponentCard key={ref.componentId} comp={comp} scale={ref.scale} />
          ) : null;
        })}
      </div>

      <div
        className="no-print"
        style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}
      >
        <label htmlFor={`qty-${item.id}`}>Batches</label>
        <input
          id={`qty-${item.id}`}
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          style={{ width: 90 }}
        />
        <span className="note-inline">
          1 batch → {item.yieldAmount} {item.yieldUnit}
        </span>
        <button className="btn" onClick={submit} disabled={saving}>
          {saving ? "Adding…" : added ? "Added ✓" : "Add to this week’s menu"}
        </button>
      </div>
    </div>
  );
}

export function MenuBuilderPage() {
  const { data } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data!.menuItems.filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.flavorTag ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, query, category]);

  const selected = results.find((m) => m.id === selectedId) ?? null;

  return (
    <>
      <p className="eyebrow">Section A · Weekly menu builder</p>
      <h1>Build this week’s menu.</h1>
      <p className="muted">
        Search the recipe database, review an item’s components, then submit it to the
        Current Menu. Confirming an item also feeds its raw ingredients into the grocery list.
      </p>

      <div className="card no-print">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="search"
            placeholder="Search menu items (e.g. strawberry, oreo)…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedId(null);
            }}
            style={{ flex: 1, minWidth: 220 }}
          />
          <Link className="btn gold" to="/new-item">
            + Add New MenuItem
          </Link>
        </div>
        <div className="btn-group" style={{ flexWrap: "wrap", marginTop: 12 }}>
          <button
            type="button"
            className={category === "all" ? "active" : ""}
            onClick={() => {
              setCategory("all");
              setSelectedId(null);
            }}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={category === c ? "active" : ""}
              onClick={() => {
                setCategory(c);
                setSelectedId(null);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 && (
        <div className="card" style={{ textAlign: "center" }}>
          <h3>No results for “{query || category}”.</h3>
          <p className="muted">
            This flavor isn’t in the database yet — like a new rotating flavor.
          </p>
          <Link className="btn" to={`/new-item?name=${encodeURIComponent(query)}`}>
            + Create “{query || "new item"}” as a new MenuItem
          </Link>
        </div>
      )}

      {!selected && results.length > 0 && (
        <div className="grid grid-3">
          {results.map((m) => (
            <button
              key={m.id}
              className="card"
              style={{ textAlign: "left", cursor: "pointer", font: "inherit" }}
              onClick={() => setSelectedId(m.id)}
            >
              <p className="eyebrow">{m.category}</p>
              <h3>{m.name}</h3>
              <p className="note-inline">
                1 batch → {m.yieldAmount} {m.yieldUnit}
                {m.isPlaceholder ? " · placeholder" : ""}
              </p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <>
          <button className="btn ghost sm no-print" onClick={() => setSelectedId(null)}>
            ← Back to results
          </button>
          <MenuItemReview item={selected} />
        </>
      )}
    </>
  );
}

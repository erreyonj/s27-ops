import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../state/AppState";
import { CATEGORIES, type Category, type ItemComponent, type MenuItem } from "../domain/types";

type BatchPick = { menuItemId: string; qty: number };

function SwapIngredientModal({
  currentName,
  onPick,
  onClose,
}: {
  currentName: string;
  onPick: (ingredientId: string) => void;
  onClose: () => void;
}) {
  const { data } = useApp();
  const [ingFilter, setIngFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const ingredients = useMemo(() => {
    const q = ingFilter.trim().toLowerCase();
    const list = data!.ingredients;
    return q ? list.filter((i) => i.name.toLowerCase().includes(q)) : list;
  }, [data, ingFilter]);

  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel modal-panel-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-ing-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>
              Swap ingredient
            </p>
            <h2 id="swap-ing-title" style={{ margin: "4px 0 0" }}>
              Replace {currentName}
            </h2>
          </div>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <input
          ref={inputRef}
          type="search"
          placeholder="Search library…"
          value={ingFilter}
          onChange={(e) => setIngFilter(e.target.value)}
          style={{ width: "100%", marginTop: 12 }}
        />
        <ul className="swap-ing-list">
          {ingredients.map((ing) => (
            <li key={ing.id}>
              <button type="button" className="swap-ing-option" onClick={() => onPick(ing.id)}>
                {ing.name}
                <span className="muted">{ing.category}</span>
              </button>
            </li>
          ))}
          {ingredients.length === 0 && (
            <li className="muted" style={{ padding: "12px 4px" }}>
              No ingredients match.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function ComponentCard({ comp, scale }: { comp: ItemComponent; scale: number }) {
  const { data, repo, refresh } = useApp();
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [swapLineIdx, setSwapLineIdx] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const ingName = (id: string) =>
    data!.ingredients.find((i) => i.id === id)?.name ?? id.replace(/-/g, " ");

  useEffect(() => {
    if (menuOpen === null) return;
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(null);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function swapIngredient(lineIdx: number, ingredientId: string) {
    const lines = comp.lines.map((l, i) =>
      i === lineIdx ? { ...l, ingredientId } : l
    );
    await repo.upsertComponent({ ...comp, lines });
    setSwapLineIdx(null);
    setMenuOpen(null);
    await refresh();
  }

  const swapLine = swapLineIdx !== null ? comp.lines[swapLineIdx] : null;

  return (
    <div className="component-card">
      <p className="eyebrow">{comp.category}</p>
      <h3>{comp.name}</h3>
      <p className="note-inline">
        1 batch → {comp.yieldAmount} {comp.yieldUnit}
        {scale !== 1 && ` · used at ${scale}× per batch`}
      </p>
      <ul className="comp-ing-list">
        {comp.lines.map((l, i) => (
          <li key={i} className="comp-ing-row">
            <span className="comp-ing-text">
              <strong>{l.qtyText}</strong>{" "}
              {l.detail ? <span className="muted">({l.detail})</span> : null} —{" "}
              {ingName(l.ingredientId)}
            </span>
            <div className="kebab-wrap" ref={menuOpen === i ? menuRef : undefined}>
              <button
                type="button"
                className="kebab-btn"
                aria-label={`Actions for ${ingName(l.ingredientId)}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen === i}
                onClick={() => setMenuOpen((open) => (open === i ? null : i))}
              >
                ⋯
              </button>
              {menuOpen === i && (
                <div className="kebab-menu" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(null);
                      setSwapLineIdx(i);
                    }}
                  >
                    Swap ingredient
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {comp.notes && <p className="note-inline" style={{ marginTop: 10 }}>{comp.notes}</p>}
      {swapLine && (
        <SwapIngredientModal
          currentName={ingName(swapLine.ingredientId)}
          onClose={() => setSwapLineIdx(null)}
          onPick={(ingredientId) => void swapIngredient(swapLineIdx!, ingredientId)}
        />
      )}
    </div>
  );
}

function IngredientModal({
  item,
  onClose,
}: {
  item: MenuItem;
  onClose: () => void;
}) {
  const { data } = useApp();
  const compById = useMemo(
    () => new Map(data!.components.map((c) => [c.id, c])),
    [data]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`ing-modal-${item.id}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>Ingredients</p>
            <h2 id={`ing-modal-${item.id}`} style={{ margin: "4px 0 0" }}>
              {item.name}
            </h2>
          </div>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="component-scroller" style={{ marginTop: 12 }}>
          {item.components.map((ref) => {
            const comp = compById.get(ref.componentId);
            return comp ? (
              <ComponentCard key={ref.componentId} comp={comp} scale={ref.scale} />
            ) : null;
          })}
        </div>
      </div>
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
      {item.brandName !== item.name && (
        <p className="note-inline" style={{ marginTop: 4 }}>
          Brand: {item.brandName}
        </p>
      )}
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

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5 3.5h8M5 8h8M5 12.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="2.5" cy="3.5" r="1" fill="currentColor" />
      <circle cx="2.5" cy="8" r="1" fill="currentColor" />
      <circle cx="2.5" cy="12.5" r="1" fill="currentColor" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BatchStackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      {/* Top-left back square: opaque fill so front stroke doesn't show through */}
      <rect
        x="1"
        y="1"
        width="8"
        height="8"
        rx="1.5"
        fill="var(--cream)"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      {/* Bottom-right front square */}
      <rect
        x="5"
        y="5"
        width="8"
        height="8"
        rx="1.5"
        fill="var(--cream)"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function MenuBuilderPage() {
  const { data, repo, refresh } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [batchPicks, setBatchPicks] = useState<BatchPick[]>([]);
  const [ingredientModalId, setIngredientModalId] = useState<string | null>(null);
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchAdded, setBatchAdded] = useState(false);

  const itemById = useMemo(
    () => new Map(data!.menuItems.map((m) => [m.id, m])),
    [data]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data!.menuItems.filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.brandName.toLowerCase().includes(q) ||
        (m.flavorTag ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, query, category]);

  const selected = results.find((m) => m.id === selectedId) ?? null;
  const batchPickIds = useMemo(
    () => new Set(batchPicks.map((p) => p.menuItemId)),
    [batchPicks]
  );
  const modalItem = ingredientModalId ? itemById.get(ingredientModalId) ?? null : null;

  function toggleBatchMode() {
    setBatchMode((on) => {
      if (on) {
        setBatchPicks([]);
        setIngredientModalId(null);
      } else {
        setSelectedId(null);
      }
      return !on;
    });
  }

  function handleCardClick(id: string) {
    if (batchMode) {
      setBatchPicks((prev) => {
        if (prev.some((p) => p.menuItemId === id)) return prev;
        return [...prev, { menuItemId: id, qty: 1 }];
      });
      return;
    }
    setSelectedId(id);
  }

  function setPickQty(id: string, qty: number) {
    setBatchPicks((prev) =>
      prev.map((p) => (p.menuItemId === id ? { ...p, qty: Math.max(1, qty) } : p))
    );
  }

  function removePick(id: string) {
    setBatchPicks((prev) => prev.filter((p) => p.menuItemId !== id));
    if (ingredientModalId === id) setIngredientModalId(null);
  }

  async function submitBatch() {
    if (batchPicks.length === 0) return;
    setBatchSaving(true);
    try {
      for (const pick of batchPicks) {
        const existing = data!.menu.entries.find((e) => e.menuItemId === pick.menuItemId);
        const total = (existing?.quantity ?? 0) + pick.qty;
        await repo.setMenuQuantity(pick.menuItemId, total);
      }
      await refresh();
      setBatchPicks([]);
      setBatchAdded(true);
      setTimeout(() => setBatchAdded(false), 2500);
    } finally {
      setBatchSaving(false);
    }
  }

  const gutterActions = (
    <div className="menu-builder-actions">
      <Link className="text-action" to="/new-item">
        <PlusIcon />
        Add New Item
      </Link>
      <button
        type="button"
        className={`text-action${batchMode ? " active" : ""}`}
        onClick={toggleBatchMode}
      >
        <BatchStackIcon />
        Batch Add to Menu
      </button>
    </div>
  );

  return (
    <>
      <p className="eyebrow">Section A · Weekly menu builder</p>
      <h1>Build this week’s menu.</h1>
      <p className="muted">
        Search the recipe database, review an item’s components, then submit it to the
        Current Menu. Confirming an item also feeds its raw ingredients into the grocery list.
      </p>

      <div className="card no-print">
        <input
          type="search"
          placeholder="Search menu items (e.g. strawberry, oreo)…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedId(null);
          }}
          style={{ width: "100%" }}
        />
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

      <div className="menu-builder-shell">
        <div className="menu-builder-main">
          {batchMode && (
            <div className="batch-tray no-print">
              <div className="batch-tray-header">
                <div>
                  <p className="eyebrow" style={{ margin: 0 }}>Batch Add to Menu</p>
                  <p className="note-inline" style={{ margin: "2px 0 0" }}>
                    {batchPicks.length === 0
                      ? "Click cards below to pin them here."
                      : `${batchPicks.length} item${batchPicks.length === 1 ? "" : "s"} pinned`}
                  </p>
                </div>
                <button
                  className="btn"
                  disabled={batchPicks.length === 0 || batchSaving}
                  onClick={() => void submitBatch()}
                >
                  {batchSaving
                    ? "Adding…"
                    : batchAdded
                      ? "Added ✓"
                      : "Add to this week’s menu"}
                </button>
              </div>
              {batchPicks.length > 0 && (
                <div className="batch-tray-scroller">
                  {batchPicks.map((pick) => {
                    const item = itemById.get(pick.menuItemId);
                    if (!item) return null;
                    return (
                      <div key={pick.menuItemId} className="batch-tray-card">
                        <div className="batch-tray-card-top">
                          <strong>{item.name}</strong>
                          <button
                            type="button"
                            className="btn ghost sm"
                            onClick={() => removePick(pick.menuItemId)}
                            aria-label={`Remove ${item.name}`}
                          >
                            ✕
                          </button>
                        </div>
                        <p className="note-inline" style={{ margin: "2px 0 8px" }}>
                          1 batch → {item.yieldAmount} {item.yieldUnit}
                        </p>
                        <div className="batch-tray-qty">
                          <label htmlFor={`batch-qty-${pick.menuItemId}`}>Batches</label>
                          <input
                            id={`batch-qty-${pick.menuItemId}`}
                            type="number"
                            min={1}
                            value={pick.qty}
                            onChange={(e) =>
                              setPickQty(pick.menuItemId, Math.max(1, Number(e.target.value) || 1))
                            }
                          />
                          <button
                            type="button"
                            className="btn ghost sm batch-list-btn"
                            onClick={() => setIngredientModalId(pick.menuItemId)}
                            aria-label={`View ingredients for ${item.name}`}
                            title="View ingredients"
                          >
                            <ListIcon />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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

          {(batchMode || !selected) && results.length > 0 && (
            <div className="grid grid-3">
              {results.map((m) => {
                const pinned = batchPickIds.has(m.id);
                return (
                  <button
                    key={m.id}
                    className={`card${pinned ? " batch-card-selected" : ""}`}
                    style={{ textAlign: "left", cursor: "pointer", font: "inherit" }}
                    onClick={() => handleCardClick(m.id)}
                  >
                    <p className="eyebrow">{m.category}</p>
                    <h3>{m.name}</h3>
                    {m.brandName !== m.name && (
                      <p className="note-inline" style={{ margin: "2px 0 0" }}>
                        Brand: {m.brandName}
                      </p>
                    )}
                    <p className="note-inline">
                      1 batch → {m.yieldAmount} {m.yieldUnit}
                      {m.isPlaceholder ? " · placeholder" : ""}
                      {pinned ? " · pinned" : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {!batchMode && selected && (
            <>
              <button className="btn ghost sm no-print" onClick={() => setSelectedId(null)}>
                ← Back to results
              </button>
              <MenuItemReview item={selected} />
            </>
          )}
        </div>

        <aside className="menu-builder-gutter no-print">{gutterActions}</aside>
      </div>

      {modalItem && (
        <IngredientModal item={modalItem} onClose={() => setIngredientModalId(null)} />
      )}
    </>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ComponentLinesModal,
  PencilIcon,
} from "../components/ComponentLinesModal";
import { useApp } from "../state/AppState";
import { scaleQtyText } from "../domain/scaling";
import { packagingUnitCost, unitCost } from "../domain/aggregate";
import { G_PER_LB } from "../domain/scaling";
import {
  CATEGORIES,
  type Category,
  type CategoryPackagingLine,
  type ItemComponent,
} from "../domain/types";

type EditTarget =
  | { kind: "component"; id: string }
  | { kind: "item"; id: string };

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

function legacyPriceNote(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const m = notes.match(/Legacy Excel batch material cost ≈ \$[\d.]+/i);
  return m ? m[0] : null;
}

type LibraryTab = "components" | "items" | "ingredients" | "packaging";

export function LibraryPage() {
  const { data, repo, refresh } = useApp();
  const [scale, setScale] = useState(1);
  const [tab, setTab] = useState<LibraryTab>("components");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<Record<string, { price: string; qty: string }>>({});
  const [pkgDraft, setPkgDraft] = useState<Record<string, { price: string; qty: string }>>({});
  const [kitCategory, setKitCategory] = useState<Category>("dough");
  const [kitSaving, setKitSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const ingName = useMemo(() => {
    const m = new Map(data!.ingredients.map((i) => [i.id, i.name]));
    return (id: string) => m.get(id) ?? id;
  }, [data]);

  const compById = useMemo(
    () => new Map(data!.components.map((c) => [c.id, c])),
    [data]
  );

  const q = query.trim().toLowerCase();

  const filteredComponents = useMemo(() => {
    return data!.components.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, category, q]);

  const filteredItems = useMemo(() => {
    return data!.menuItems.filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (
        q &&
        !m.name.toLowerCase().includes(q) &&
        !m.brandName.toLowerCase().includes(q) &&
        !(m.flavorTag ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [data, category, q]);

  const filteredIngredients = useMemo(() => {
    if (!q) return data!.ingredients;
    return data!.ingredients.filter((i) => i.name.toLowerCase().includes(q));
  }, [data, q]);

  const pricedCount = data!.ingredients.filter((i) => unitCost(i) != null).length;

  function toggleExpanded(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function savePrice(id: string) {
    const d = draft[id];
    if (!d) return;
    const ing = data!.ingredients.find((i) => i.id === id);
    if (!ing) return;
    const price = d.price === "" ? null : Number(d.price);
    const qty = d.qty === "" ? null : Number(d.qty);
    await repo.updateIngredientPrice(id, price, qty, ing.baseUnit);
    const next = { ...draft };
    delete next[id];
    setDraft(next);
    await refresh();
  }

  async function setPublishToSite(id: string, publishToSite: boolean) {
    const item = data!.menuItems.find((m) => m.id === id);
    if (!item || item.publishToSite === publishToSite) return;
    await repo.upsertMenuItem({ ...item, publishToSite });
    await refresh();
  }

  async function savePkgPrice(id: string) {
    const d = pkgDraft[id];
    if (!d) return;
    const supply = data!.packagingSupplies.find((s) => s.id === id);
    if (!supply) return;
    const price = d.price === "" ? null : Number(d.price);
    const qty = d.qty === "" ? null : Number(d.qty);
    await repo.upsertPackagingSupply({
      ...supply,
      packPrice: price,
      packQty: qty,
    });
    const next = { ...pkgDraft };
    delete next[id];
    setPkgDraft(next);
    await refresh();
  }

  const kitLines = useMemo(() => {
    return data!.categoryPackaging
      .filter((l) => l.category === kitCategory)
      .slice()
      .sort((a, b) => a.sort - b.sort);
  }, [data, kitCategory]);

  const kitSelected = useMemo(
    () => new Set(kitLines.map((l) => l.supplyId)),
    [kitLines]
  );

  async function toggleKitSupply(supplyId: string) {
    setKitSaving(true);
    try {
      let next: CategoryPackagingLine[];
      if (kitSelected.has(supplyId)) {
        next = kitLines.filter((l) => l.supplyId !== supplyId);
      } else {
        next = [
          ...kitLines,
          {
            category: kitCategory,
            supplyId,
            qtyPerUnit: 1,
            sort: kitLines.length,
          },
        ];
      }
      await repo.setCategoryPackaging(
        kitCategory,
        next.map((l, i) => ({ ...l, sort: i }))
      );
      await refresh();
    } finally {
      setKitSaving(false);
    }
  }

  const editModal = useMemo(() => {
    if (!editTarget) return null;
    if (editTarget.kind === "component") {
      const c = compById.get(editTarget.id);
      if (!c) return null;
      return {
        title: c.name,
        components: [c] as ItemComponent[],
        sharedNote: false,
      };
    }
    const item = data!.menuItems.find((m) => m.id === editTarget.id);
    if (!item) return null;
    const comps = item.components
      .map((ref) => compById.get(ref.componentId))
      .filter((c): c is ItemComponent => !!c);
    if (comps.length === 0) return null;
    return {
      title: item.name,
      components: comps,
      sharedNote: true,
    };
  }, [editTarget, compById, data]);

  return (
    <>
      <p className="eyebrow">Library</p>
      <h1>Recipe &amp; ingredient database.</h1>

      <div className="no-print" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div className="btn-group">
          {(
            [
              ["components", "Components"],
              ["items", "Menu items"],
              ["ingredients", "Ingredients"],
              ["packaging", "Packaging"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => {
                setTab(key);
                setExpanded({});
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "components" && (
          <div className="btn-group">
            {[1, 2, 3].map((s) => (
              <button key={s} className={scale === s ? "active" : ""} onClick={() => setScale(s)}>
                {s}×
              </button>
            ))}
          </div>
        )}
      </div>

      {tab !== "packaging" && (
        <div className="card no-print" style={{ marginBottom: 16 }}>
          <input
            type="search"
            placeholder={
              tab === "ingredients"
                ? "Search ingredients…"
                : tab === "items"
                  ? "Search menu items…"
                  : "Search components…"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", marginBottom: tab === "ingredients" ? 0 : 12 }}
          />
          {tab !== "ingredients" && (
            <div className="btn-group" style={{ flexWrap: "wrap" }}>
              <button
                type="button"
                className={category === "all" ? "active" : ""}
                onClick={() => setCategory("all")}
              >
                All
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={category === c ? "active" : ""}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "components" && (
        <div className="grid grid-3">
          {filteredComponents.map((c) => {
            const open = !!expanded[c.id];
            const legacy = legacyPriceNote(c.notes);
            return (
              <div className="card library-card" key={c.id} style={{ padding: 14 }}>
                {open && (
                  <button
                    type="button"
                    className="library-card-edit no-print"
                    aria-label="Edit ingredients"
                    onClick={() => setEditTarget({ kind: "component", id: c.id })}
                  >
                    <PencilIcon />
                  </button>
                )}
                <p className="eyebrow" style={{ marginBottom: 4 }}>
                  {c.category}
                </p>
                <h3 style={{ margin: "0 0 6px", fontSize: "1.05rem", paddingRight: open ? 36 : 0 }}>
                  {c.name}
                </h3>
                <p className="note-inline" style={{ margin: 0 }}>
                  1 batch → {c.yieldAmount} {c.yieldUnit}
                  {open && scale !== 1 ? ` (showing ${scale} batches)` : ""}
                </p>
                {legacy && (
                  <p className="note-inline" style={{ margin: "6px 0 0" }}>
                    {legacy}
                  </p>
                )}
                <button
                  type="button"
                  className="btn ghost sm no-print"
                  style={{ marginTop: 10 }}
                  onClick={() => toggleExpanded(c.id)}
                >
                  {open ? "Hide ingredients" : "Show ingredients"}
                </button>
                {open && (
                  <>
                    <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0" }}>
                      {c.lines.map((l, i) => (
                        <li
                          key={i}
                          style={{ padding: "4px 0", borderBottom: "1px solid var(--line)" }}
                        >
                          <strong>{scaleQtyText(l.qtyText, scale)}</strong>{" "}
                          {l.detail && (
                            <span className="muted">({scaleQtyText(l.detail, scale)})</span>
                          )}{" "}
                          — {ingName(l.ingredientId)}
                        </li>
                      ))}
                    </ul>
                    {c.notes && !legacy && (
                      <p className="note-inline" style={{ marginTop: 10 }}>
                        {c.notes}
                      </p>
                    )}
                    {c.notes && legacy && c.notes !== legacy && (
                      <p className="note-inline" style={{ marginTop: 10 }}>
                        {c.notes}
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
          {filteredComponents.length === 0 && (
            <p className="muted">No components match this search.</p>
          )}
        </div>
      )}

      {tab === "items" && (
        <div className="grid grid-3">
          {filteredItems.map((m) => {
            const open = !!expanded[m.id];
            const legacyNotes = m.components
              .map((ref) => legacyPriceNote(compById.get(ref.componentId)?.notes ?? null))
              .filter((n): n is string => !!n);
            return (
              <div className="card library-card" key={m.id} style={{ padding: 14 }}>
                {open && (
                  <button
                    type="button"
                    className="library-card-edit no-print"
                    aria-label="Edit ingredients"
                    onClick={() => setEditTarget({ kind: "item", id: m.id })}
                  >
                    <PencilIcon />
                  </button>
                )}
                <p className="eyebrow" style={{ marginBottom: 4 }}>
                  {m.category}
                </p>
                <div style={{ display: "flex", gap: 6, alignItems: "baseline", flexWrap: "wrap", paddingRight: open ? 36 : 0 }}>
                  <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{m.name}</h3>
                  {m.isPrimary && <span className="pill rose">primary</span>}
                  {m.isPlaceholder && <span className="pill warn">placeholder</span>}
                  {m.publishToSite && <span className="pill rose">on site</span>}
                </div>
                {m.brandName !== m.name && (
                  <p className="note-inline" style={{ margin: "4px 0 0" }}>
                    Brand: {m.brandName}
                  </p>
                )}
                <p className="note-inline" style={{ margin: "6px 0 0" }}>
                  1 batch → {m.yieldAmount} {m.yieldUnit}
                </p>
                {legacyNotes[0] && (
                  <p className="note-inline" style={{ margin: "6px 0 0" }}>
                    {legacyNotes[0]}
                  </p>
                )}
                <button
                  type="button"
                  className="btn ghost sm no-print"
                  style={{ marginTop: 10 }}
                  onClick={() => toggleExpanded(m.id)}
                >
                  {open ? "Hide ingredients" : "Show ingredients"}
                </button>
                {open && (
                  <>
                    <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0" }}>
                      {m.components.map((ref) => {
                        const c = compById.get(ref.componentId);
                        return (
                          <li
                            key={ref.componentId}
                            style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}
                          >
                            <strong>{c?.name ?? ref.componentId}</strong>
                            <span className="muted">
                              {" "}
                              · {c ? `${c.yieldAmount} ${c.yieldUnit}/batch` : ""}
                              {ref.scale !== 1 ? ` · ${ref.scale}×` : ""}
                            </span>
                            {c && (
                              <ul style={{ listStyle: "none", padding: "6px 0 0 10px", margin: 0 }}>
                                {c.lines.map((l, i) => (
                                  <li key={i} style={{ padding: "2px 0" }}>
                                    <strong>{l.qtyText}</strong>{" "}
                                    {l.detail && <span className="muted">({l.detail})</span>} —{" "}
                                    {ingName(l.ingredientId)}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    {m.assemblyNotes && (
                      <p className="note-inline" style={{ marginTop: 10 }}>
                        {m.assemblyNotes}
                      </p>
                    )}
                    <div
                      className="check-row no-print"
                      style={{
                        marginTop: 12,
                        borderBottom: "none",
                        opacity: m.isPlaceholder ? 0.5 : 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        id={`publish-${m.id}`}
                        checked={m.publishToSite}
                        disabled={m.isPlaceholder}
                        onChange={(e) => void setPublishToSite(m.id, e.target.checked)}
                      />
                      <label htmlFor={`publish-${m.id}`}>Publish to site</label>
                    </div>
                    <p className="note-inline" style={{ marginTop: 8 }}>
                      <Link to={`/pricer?item=${encodeURIComponent(m.id)}`}>Open in Pricer →</Link>
                    </p>
                  </>
                )}
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <p className="muted">No menu items match this search.</p>
          )}
        </div>
      )}

      {tab === "ingredients" && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Ingredient pack prices</h3>
          <p className="note-inline">
            {pricedCount} of {data!.ingredients.length} priced. Weight packs in grams (1 lb ={" "}
            {Math.round(G_PER_LB)} g); count packs by count; spices may be per teaspoon.
          </p>
          <table>
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Store</th>
                <th className="num">Pack price ($)</th>
                <th className="num">Pack contains</th>
                <th className="num">$ / lb, ea, or tsp</th>
                <th className="no-print"></th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.map((ing) => {
                const d = draft[ing.id] ?? {
                  price: ing.packPrice?.toString() ?? "",
                  qty: ing.packQty?.toString() ?? "",
                };
                const cost = unitCost(ing);
                const per =
                  cost == null
                    ? "—"
                    : ing.baseUnit === "g"
                      ? `${money(cost * G_PER_LB)}/lb`
                      : ing.baseUnit === "tsp"
                        ? `${money(cost)}/tsp`
                        : `${money(cost)}/ea`;
                const dirty = draft[ing.id] != null;
                return (
                  <tr key={ing.id}>
                    <td>
                      <strong>{ing.name}</strong>
                      <div className="note-inline">{ing.packageSize ?? ""}</div>
                    </td>
                    <td className="muted">{ing.suggestedStore ?? "—"}</td>
                    <td className="num">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={d.price}
                        onChange={(e) =>
                          setDraft({ ...draft, [ing.id]: { ...d, price: e.target.value } })
                        }
                        style={{ width: 90, textAlign: "right" }}
                      />
                    </td>
                    <td className="num">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={d.qty}
                        onChange={(e) =>
                          setDraft({ ...draft, [ing.id]: { ...d, qty: e.target.value } })
                        }
                        style={{ width: 110, textAlign: "right" }}
                      />
                      <span className="muted" style={{ marginLeft: 6 }}>
                        {ing.baseUnit}
                      </span>
                    </td>
                    <td className="num muted">{per}</td>
                    <td className="no-print">
                      {dirty && (
                        <button className="btn sm" onClick={() => savePrice(ing.id)}>
                          Save
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredIngredients.length === 0 && (
            <p className="muted">No ingredients match this search.</p>
          )}
        </div>
      )}

      {tab === "packaging" && (
        <>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Packaging supplies</h3>
            <p className="note-inline">
              Pack price ÷ pack count = unit cost. Each sellable unit uses the category kit
              below (cookies / dough = bag + rounded label; others = box + square label).
            </p>
            <table>
              <thead>
                <tr>
                  <th>Supply</th>
                  <th className="num">Pack price ($)</th>
                  <th className="num">Pack contains</th>
                  <th className="num">$ / ea</th>
                  <th className="no-print"></th>
                </tr>
              </thead>
              <tbody>
                {data!.packagingSupplies.map((s) => {
                  const d = pkgDraft[s.id] ?? {
                    price: s.packPrice?.toString() ?? "",
                    qty: s.packQty?.toString() ?? "",
                  };
                  const cost = packagingUnitCost(s);
                  const dirty = pkgDraft[s.id] != null;
                  return (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.name}</strong>
                        {s.notes && <div className="note-inline">{s.notes}</div>}
                      </td>
                      <td className="num">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={d.price}
                          onChange={(e) =>
                            setPkgDraft({
                              ...pkgDraft,
                              [s.id]: { ...d, price: e.target.value },
                            })
                          }
                          style={{ width: 90, textAlign: "right" }}
                        />
                      </td>
                      <td className="num">
                        <input
                          type="number"
                          min={0}
                          step="1"
                          value={d.qty}
                          onChange={(e) =>
                            setPkgDraft({
                              ...pkgDraft,
                              [s.id]: { ...d, qty: e.target.value },
                            })
                          }
                          style={{ width: 90, textAlign: "right" }}
                        />
                      </td>
                      <td className="num muted">
                        {cost == null ? "—" : money(cost)}
                      </td>
                      <td className="no-print">
                        {dirty && (
                          <button className="btn sm" onClick={() => void savePkgPrice(s.id)}>
                            Save
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Category kits</h3>
            <p className="note-inline">
              Toggle which supplies apply per category. Qty is always 1 per sellable unit
              (× menu yield in the pricer).
            </p>
            <div className="btn-group" style={{ flexWrap: "wrap", marginBottom: 12 }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={kitCategory === c ? "active" : ""}
                  onClick={() => setKitCategory(c)}
                  disabled={kitSaving}
                >
                  {c}
                </button>
              ))}
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {data!.packagingSupplies.map((s) => {
                const on = kitSelected.has(s.id);
                return (
                  <li key={s.id} className="check-row" style={{ borderBottom: "1px solid var(--line)" }}>
                    <input
                      type="checkbox"
                      id={`kit-${kitCategory}-${s.id}`}
                      checked={on}
                      disabled={kitSaving}
                      onChange={() => void toggleKitSupply(s.id)}
                    />
                    <label htmlFor={`kit-${kitCategory}-${s.id}`}>{s.name}</label>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      {editModal && (
        <ComponentLinesModal
          title={editModal.title}
          components={editModal.components}
          sharedNote={editModal.sharedNote}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../state/AppState";
import { scaleQtyText } from "../domain/scaling";
import { unitCost } from "../domain/aggregate";
import { G_PER_LB } from "../domain/scaling";

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function LibraryPage() {
  const { data, repo, refresh } = useApp();
  const [scale, setScale] = useState(1);
  const [tab, setTab] = useState<"components" | "items" | "ingredients">("components");
  const [draft, setDraft] = useState<Record<string, { price: string; qty: string }>>({});

  const ingName = useMemo(() => {
    const m = new Map(data!.ingredients.map((i) => [i.id, i.name]));
    return (id: string) => m.get(id) ?? id;
  }, [data]);

  const compById = useMemo(
    () => new Map(data!.components.map((c) => [c.id, c])),
    [data]
  );

  const pricedCount = data!.ingredients.filter((i) => unitCost(i) != null).length;

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
            ] as const
          ).map(([key, label]) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
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

      {tab === "components" && (
        <div className="grid grid-2">
          {data!.components.map((c) => (
            <div className="card" key={c.id}>
              <p className="eyebrow">{c.type}</p>
              <h3>{c.name}</h3>
              <p className="note-inline">
                1 batch → {c.yieldAmount} {c.yieldUnit}
                {scale !== 1 && ` (showing ${scale} batches)`}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0" }}>
                {c.lines.map((l, i) => (
                  <li key={i} style={{ padding: "4px 0", borderBottom: "1px solid var(--line)" }}>
                    <strong>{scaleQtyText(l.qtyText, scale)}</strong>{" "}
                    {l.detail && <span className="muted">({scaleQtyText(l.detail, scale)})</span>} —{" "}
                    {ingName(l.ingredientId)}
                  </li>
                ))}
              </ul>
              {c.notes && <p className="note-inline" style={{ marginTop: 10 }}>{c.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === "items" && (
        <div className="grid grid-2">
          {data!.menuItems.map((m) => (
            <div className="card" key={m.id}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                <h3 style={{ margin: 0 }}>{m.name}</h3>
                {m.isPrimary && <span className="pill rose">primary</span>}
                {m.isPlaceholder && <span className="pill warn">placeholder</span>}
                <span className="pill">
                  {m.yieldAmount} {m.yieldUnit}
                </span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0" }}>
                {m.components.map((ref) => {
                  const c = compById.get(ref.componentId);
                  return (
                    <li key={ref.componentId} style={{ padding: "4px 0", borderBottom: "1px solid var(--line)" }}>
                      {c?.name ?? ref.componentId}
                      <span className="muted">
                        {" "}
                        · {c ? `${c.yieldAmount} ${c.yieldUnit}/batch` : ""}
                        {ref.scale !== 1 ? ` · ${ref.scale}×` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {m.assemblyNotes && (
                <p className="note-inline" style={{ marginTop: 10 }}>{m.assemblyNotes}</p>
              )}
              <p className="note-inline" style={{ marginTop: 8 }}>
                <Link to={`/pricer?item=${encodeURIComponent(m.id)}`}>Open in Pricer →</Link>
              </p>
            </div>
          ))}
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
              {data!.ingredients.map((ing) => {
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
        </div>
      )}
    </>
  );
}

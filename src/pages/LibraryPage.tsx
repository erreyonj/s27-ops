import { useMemo, useState } from "react";
import { useApp } from "../state/AppState";
import { scaleQtyText } from "../domain/scaling";

export function LibraryPage() {
  const { data } = useApp();
  const [scale, setScale] = useState(1);
  const [tab, setTab] = useState<"components" | "items" | "ingredients">("components");

  const ingName = useMemo(() => {
    const m = new Map(data!.ingredients.map((i) => [i.id, i.name]));
    return (id: string) => m.get(id) ?? id;
  }, [data]);

  const compById = useMemo(
    () => new Map(data!.components.map((c) => [c.id, c])),
    [data]
  );

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
            </div>
          ))}
        </div>
      )}

      {tab === "ingredients" && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Suggested store</th>
                <th>Package</th>
                <th>Rounding rule</th>
              </tr>
            </thead>
            <tbody>
              {data!.ingredients.map((i) => (
                <tr key={i.id}>
                  <td>
                    <strong>{i.name}</strong>
                  </td>
                  <td>
                    {i.suggestedStore ? (
                      <span className="pill">Suggested: {i.suggestedStore}</span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="muted">{i.packageSize ?? "—"}</td>
                  <td className="muted">
                    {i.roundTo
                      ? `round up to ${i.roundLabel ?? `${i.roundTo} ${i.baseUnit}`}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

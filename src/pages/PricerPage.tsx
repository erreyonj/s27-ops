import { useMemo, useState } from "react";
import { useApp } from "../state/AppState";
import { menuItemCost, unitCost } from "../domain/aggregate";
import { G_PER_LB } from "../domain/scaling";

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function PricerPage() {
  const { data, repo, refresh } = useApp();
  const [multiplier, setMultiplier] = useState(3);
  const [draft, setDraft] = useState<Record<string, { price: string; qty: string }>>({});

  const ingById = useMemo(
    () => new Map(data!.ingredients.map((i) => [i.id, i])),
    [data]
  );
  const compById = useMemo(
    () => new Map(data!.components.map((c) => [c.id, c])),
    [data]
  );

  const pricedCount = data!.ingredients.filter((i) => unitCost(i) != null).length;

  async function savePrice(id: string) {
    const d = draft[id];
    if (!d) return;
    const ing = ingById.get(id)!;
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
      <p className="eyebrow">Section C · Retail pricer</p>
      <h1>What should it sell for?</h1>
      <p className="muted">
        Enter what you pay per pack for each ingredient. Costs roll up per component, per
        menu item, per unit — then a margin multiplier suggests a retail price. Starter
        prices and recipes come from the legacy Excel pricer via{" "}
        <code>npm run import:legacy</code>.
      </p>

      <div className="card">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Suggested retail per unit</h3>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            Margin multiplier
            <input
              type="number"
              min={1}
              step={0.25}
              value={multiplier}
              onChange={(e) => setMultiplier(Math.max(1, Number(e.target.value) || 1))}
              style={{ width: 90 }}
            />
          </label>
        </div>
        <p className="note-inline">
          3× ingredient cost is a common bakery starting point; nudge for labor, packaging
          and what the market bears.
        </p>
        <table>
          <thead>
            <tr>
              <th>Menu item</th>
              <th className="num">Ingredient cost / unit</th>
              <th className="num">Suggested retail</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {data!.menuItems.map((m) => {
              const cost = menuItemCost(m, compById, ingById);
              const complete = cost.missing.length === 0;
              return (
                <tr key={m.id}>
                  <td>
                    <strong>{m.name}</strong>
                    <div className="note-inline">
                      {cost.parts.map((p) => `${p.name}: ${money(p.perUnit)}`).join(" · ")}
                    </div>
                  </td>
                  <td className="num">{money(cost.perUnit)}</td>
                  <td className="num">
                    <strong>{complete ? money(cost.perUnit * multiplier) : "—"}</strong>
                  </td>
                  <td>
                    {complete ? (
                      <span className="pill">all ingredients priced</span>
                    ) : (
                      <span className="pill warn">
                        missing prices: {cost.missing.slice(0, 3).join(", ")}
                        {cost.missing.length > 3 ? "…" : ""}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Ingredient price table</h3>
        <p className="note-inline">
          {pricedCount} of {data!.ingredients.length} ingredients priced. Weight items are
          per pack in grams (1 lb = {Math.round(G_PER_LB)} g); count items are per pack
          count (e.g. 60 eggs); spices/extracts may be per pack in teaspoons.
        </p>
        <table>
          <thead>
            <tr>
              <th>Ingredient</th>
              <th className="num">Pack price ($)</th>
              <th className="num">Pack contains (g / count / tsp)</th>
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
    </>
  );
}

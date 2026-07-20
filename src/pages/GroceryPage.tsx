import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../state/AppState";
import { groceryLines, groupByStore } from "../domain/aggregate";
import { formatWeight } from "../domain/scaling";
import type { GroceryLine } from "../domain/types";

function storeClass(store: string): string {
  if (store === "Costco") return "costco";
  if (store === "Restaurant Depot") return "rd";
  if (store === "Walmart") return "walmart";
  return "";
}

function amountText(line: GroceryLine): string {
  const ing = line.ingredient;
  if (ing.baseUnit === "count") {
    const rounded = line.rounded;
    if (ing.roundTo === 12) return `${rounded} (${rounded / 12} dozen)`;
    if (ing.roundLabel && ing.roundTo)
      return `${rounded} (${Math.round(rounded / ing.roundTo)} ${ing.roundLabel})`;
    return String(rounded);
  }
  return formatWeight(line.rounded);
}

export function GroceryPage() {
  const { data } = useApp();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  const lines = useMemo(() => groceryLines(data!), [data]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lines;
    return lines.filter((l) => l.ingredient.name.toLowerCase().includes(q));
  }, [lines, query]);
  const groups = useMemo(() => groupByStore(filtered), [filtered]);

  async function share() {
    const text = groups
      .map(
        (g) =>
          `${g.store} (suggested)\n` +
          g.lines.map((l) => `  - ${amountText(l)} ${l.ingredient.name}`).join("\n")
      )
      .join("\n\n");
    const payload = `Tailer Nicole grocery list\n\n${text}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Grocery list", text: payload });
        return;
      } catch {
        /* user cancelled; fall through to clipboard */
      }
    }
    await navigator.clipboard.writeText(payload);
    alert("Grocery list copied to clipboard.");
  }

  return (
    <>
      <p className="eyebrow">Section D · Grocery aggregator</p>
      <h1>Shopping list from the current menu.</h1>

      {lines.length === 0 ? (
        <div className="card" style={{ textAlign: "center" }}>
          <h3>Menu is empty.</h3>
          <p className="muted">Add items in the Menu Builder to generate a grocery list.</p>
          <Link className="btn" to="/">
            Go to Menu Builder
          </Link>
        </div>
      ) : (
        <>
          <div
            className="card no-print"
            style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}
          >
            <input
              type="search"
              placeholder="Search ingredients…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, minWidth: 200 }}
            />
            <button className="btn ghost sm" onClick={share}>
              Share / copy
            </button>
            <button className="btn ghost sm" onClick={() => window.print()}>
              Print
            </button>
          </div>

          <p className="note-inline">
            Store labels are <strong>suggestions</strong>, not requirements. Rounded
            quantities include buffers for flagged items (eggs by the dozen, butter by the
            pound, Oreos by the pack).
          </p>

          {groups.map((g) => (
            <div className="card" key={g.store}>
              <h3>
                <span className={`pill ${storeClass(g.store)}`}>Suggested: {g.store}</span>
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
                {g.lines.map((l) => {
                  const done = !!checked[l.ingredient.id];
                  return (
                    <li className={`check-row${done ? " done" : ""}`} key={l.ingredient.id}>
                      <input
                        type="checkbox"
                        id={`chk-${l.ingredient.id}`}
                        checked={done}
                        onChange={(e) =>
                          setChecked({ ...checked, [l.ingredient.id]: e.target.checked })
                        }
                      />
                      <label htmlFor={`chk-${l.ingredient.id}`}>
                        <strong>{amountText(l)}</strong> — {l.ingredient.name}
                        {l.ingredient.packageSize && (
                          <span className="note-inline"> ({l.ingredient.packageSize})</span>
                        )}
                        {l.wasRounded && (
                          <>
                            {" "}
                            <span className="pill warn" title="Rounded up by a buffer rule">
                              rounded up
                            </span>
                          </>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </>
      )}
    </>
  );
}

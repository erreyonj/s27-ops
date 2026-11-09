import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../state/AppState";
import { componentBatches } from "../domain/aggregate";

export function CurrentMenuPage() {
  const { data, repo, refresh } = useApp();
  const itemById = useMemo(
    () => new Map(data!.menuItems.map((m) => [m.id, m])),
    [data]
  );
  const batches = useMemo(() => componentBatches(data!), [data]);
  const compById = useMemo(
    () => new Map(data!.components.map((c) => [c.id, c])),
    [data]
  );

  const entries = data!.menu.entries.filter((e) => e.quantity > 0);
  const totalUnits = entries.reduce((sum, e) => sum + e.quantity, 0);

  async function setQty(menuItemId: string, quantity: number) {
    if (quantity <= 0) await repo.removeMenuEntry(menuItemId);
    else await repo.setMenuQuantity(menuItemId, quantity);
    await refresh();
  }

  async function setPublishToSite(id: string, publishToSite: boolean) {
    const item = data!.menuItems.find((m) => m.id === id);
    if (!item || item.publishToSite === publishToSite) return;
    await repo.upsertMenuItem({ ...item, publishToSite });
    await refresh();
  }

  async function setBrandName(id: string, brandName: string) {
    const item = data!.menuItems.find((m) => m.id === id);
    if (!item) return;
    const next = brandName.trim() || item.name;
    if (item.brandName === next) return;
    await repo.upsertMenuItem({ ...item, brandName: next });
    await refresh();
  }

  async function clearAll() {
    if (confirm("Clear the entire weekly menu?")) {
      await repo.clearMenu();
      await refresh();
    }
  }

  return (
    <>
      <p className="eyebrow">Current menu</p>
      <h1>This week’s lineup.</h1>

      {entries.length === 0 ? (
        <div className="card" style={{ textAlign: "center" }}>
          <h3>Nothing on the menu yet.</h3>
          <p className="muted">Add items from the Menu Builder.</p>
          <Link className="btn" to="/">
            Go to Menu Builder
          </Link>
        </div>
      ) : (
        <>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="no-print">With Title</th>
                  <th className="num">Batches</th>
                  <th className="num no-print">Publish</th>
                  <th className="num no-print">Remove</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const item = itemById.get(e.menuItemId);
                  return (
                    <tr key={e.menuItemId}>
                      <td>
                        <strong>{item?.name ?? e.menuItemId}</strong>
                        {item && (
                          <span className="muted">
                            {" "}
                            · 1 batch → {item.yieldAmount} {item.yieldUnit}
                          </span>
                        )}
                        {item?.isPlaceholder && (
                          <>
                            {" "}
                            <span className="pill warn">placeholder</span>
                          </>
                        )}
                        {item?.publishToSite && (
                          <>
                            {" "}
                            <span className="pill rose">on site</span>
                          </>
                        )}
                      </td>
                      <td className="no-print">
                        {item ? (
                          <input
                            type="text"
                            defaultValue={item.brandName}
                            key={`${item.id}-${item.brandName}`}
                            placeholder={item.name}
                            aria-label={`Public title for ${item.name}`}
                            onBlur={(ev) => void setBrandName(item.id, ev.target.value)}
                            onKeyDown={(ev) => {
                              if (ev.key === "Enter") {
                                (ev.target as HTMLInputElement).blur();
                              }
                            }}
                            style={{ width: "100%", minWidth: 160 }}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="num">
                        <input
                          type="number"
                          min={0}
                          value={e.quantity}
                          onChange={(ev) => setQty(e.menuItemId, Number(ev.target.value) || 0)}
                          style={{ width: 84, textAlign: "right" }}
                        />
                      </td>
                      <td className="num no-print">
                        {item ? (
                          <input
                            type="checkbox"
                            id={`publish-menu-${item.id}`}
                            checked={item.publishToSite}
                            disabled={item.isPlaceholder}
                            title={
                              item.isPlaceholder
                                ? "Placeholders cannot be published"
                                : "Publish to farmers market page"
                            }
                            onChange={(ev) => void setPublishToSite(item.id, ev.target.checked)}
                            style={{ width: 18, height: 18, accentColor: "var(--berry)" }}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="num no-print">
                        <button className="btn ghost sm" onClick={() => setQty(e.menuItemId, 0)}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="note-inline" style={{ marginTop: 10 }}>
              {totalUnits} total batch{totalUnits === 1 ? "" : "es"} this week.
            </p>
          </div>

          <div className="card">
            <h3>Batches to make</h3>
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th className="num">Batches</th>
                  <th>Covers</th>
                </tr>
              </thead>
              <tbody>
                {[...batches.entries()]
                  .filter(([, n]) => n > 0)
                  .map(([compId, n]) => {
                    const comp = compById.get(compId);
                    return (
                      <tr key={compId}>
                        <td>{comp?.name ?? compId}</td>
                        <td className="num">
                          <span className="badge">{n}</span>
                        </td>
                        <td className="muted">
                          {comp ? `${comp.yieldAmount} ${comp.yieldUnit} per batch` : ""}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn" to="/grocery">
              View grocery list →
            </Link>
            <button className="btn ghost" onClick={() => window.print()}>
              Print
            </button>
            <button className="btn ghost" onClick={clearAll}>
              Clear menu
            </button>
          </div>
        </>
      )}
    </>
  );
}

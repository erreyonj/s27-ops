import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApp } from "../state/AppState";
import {
  formatRetailPerUnit,
  menuItemCost,
  quoteMenuItem,
  type QuoteDraft,
} from "../domain/aggregate";
import type { BakerySettings, MenuItem } from "../domain/types";

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

function pctLabel(n: number): string {
  return `${(n * 100).toFixed(n * 100 === Math.round(n * 100) ? 0 : 1)}%`;
}

function draftFromItem(item: MenuItem): QuoteDraft {
  return {
    laborHours: item.laborHours,
    marginPct: item.marginPct,
    discountPct: item.discountPct,
  };
}

export function PricerPage() {
  const { data, repo, refresh } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("item")
  );
  const [draft, setDraft] = useState<QuoteDraft | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<BakerySettings>(data!.settings);
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [showIngredientPeek, setShowIngredientPeek] = useState(false);

  const ingById = useMemo(
    () => new Map(data!.ingredients.map((i) => [i.id, i])),
    [data]
  );
  const compById = useMemo(
    () => new Map(data!.components.map((c) => [c.id, c])),
    [data]
  );

  const selected = useMemo(
    () => data!.menuItems.find((m) => m.id === selectedId) ?? null,
    [data, selectedId]
  );

  useEffect(() => {
    setSettingsDraft(data!.settings);
  }, [data]);

  useEffect(() => {
    const fromUrl = searchParams.get("item");
    if (fromUrl && data!.menuItems.some((m) => m.id === fromUrl)) {
      setSelectedId(fromUrl);
    }
  }, [searchParams, data]);

  useEffect(() => {
    if (selected) setDraft(draftFromItem(selected));
    else setDraft(null);
  }, [selected?.id, selected?.laborHours, selected?.marginPct, selected?.discountPct]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = data!.menuItems;
    if (!q) return items;
    return items.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.flavorTag ?? "").toLowerCase().includes(q) ||
        (m.assemblyNotes ?? "").toLowerCase().includes(q)
    );
  }, [data, query]);

  const quote = useMemo(() => {
    if (!selected || !draft) return null;
    return quoteMenuItem(selected, compById, ingById, data!.settings, draft);
  }, [selected, draft, compById, ingById, data]);

  function selectItem(id: string) {
    setSelectedId(id);
    setSearchParams({ item: id }, { replace: true });
  }

  async function saveDefaults() {
    setSavingDefaults(true);
    try {
      await repo.updateBakerySettings({ ...settingsDraft, id: "default" });
      await refresh();
    } finally {
      setSavingDefaults(false);
    }
  }

  async function commitItem() {
    if (!selected || !draft) return;
    setCommitting(true);
    try {
      await repo.upsertMenuItem({
        ...selected,
        laborHours: draft.laborHours,
        marginPct: draft.marginPct,
        discountPct: draft.discountPct,
      });
      await refresh();
    } finally {
      setCommitting(false);
    }
  }

  function resetDraft() {
    if (selected) setDraft(draftFromItem(selected));
  }

  const defaultsDirty =
    settingsDraft.hourlyRate !== data!.settings.hourlyRate ||
    settingsDraft.salesTaxPct !== data!.settings.salesTaxPct ||
    settingsDraft.defaultMarginPct !== data!.settings.defaultMarginPct ||
    settingsDraft.defaultDiscountPct !== data!.settings.defaultDiscountPct;

  const itemDirty =
    selected &&
    draft &&
    (draft.laborHours !== selected.laborHours ||
      draft.marginPct !== selected.marginPct ||
      draft.discountPct !== selected.discountPct);

  return (
    <>
      <p className="eyebrow">Section C · Pricing calculator</p>
      <h1>Quote a menu item.</h1>
      <p className="muted">
        Materials roll up from recipes. Add labor hours, then apply bakery margin, discount,
        and tax — same shape as the legacy Excel calculator. Ingredient pack prices live in{" "}
        <Link to="/library">Library → Ingredients</Link>.
      </p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Bakery defaults</h3>
        <p className="note-inline">
          Hourly rate and sales tax are global. Default margin / discount apply when a menu
          item has no override (null).
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
            marginTop: 12,
          }}
        >
          <label>
            Hourly rate ($)
            <input
              type="number"
              min={0}
              step="0.25"
              value={settingsDraft.hourlyRate}
              onChange={(e) =>
                setSettingsDraft({
                  ...settingsDraft,
                  hourlyRate: Math.max(0, Number(e.target.value) || 0),
                })
              }
            />
          </label>
          <label>
            Sales tax (%)
            <input
              type="number"
              min={0}
              step="0.1"
              value={Number((settingsDraft.salesTaxPct * 100).toFixed(4))}
              onChange={(e) =>
                setSettingsDraft({
                  ...settingsDraft,
                  salesTaxPct: Math.max(0, Number(e.target.value) || 0) / 100,
                })
              }
            />
          </label>
          <label>
            Default margin (%)
            <input
              type="number"
              min={0}
              max={99}
              step="1"
              value={Number((settingsDraft.defaultMarginPct * 100).toFixed(4))}
              onChange={(e) =>
                setSettingsDraft({
                  ...settingsDraft,
                  defaultMarginPct: Math.min(
                    0.99,
                    Math.max(0, Number(e.target.value) || 0) / 100
                  ),
                })
              }
            />
          </label>
          <label>
            Default discount (%)
            <input
              type="number"
              min={0}
              max={100}
              step="1"
              value={Number((settingsDraft.defaultDiscountPct * 100).toFixed(4))}
              onChange={(e) =>
                setSettingsDraft({
                  ...settingsDraft,
                  defaultDiscountPct: Math.min(
                    1,
                    Math.max(0, Number(e.target.value) || 0) / 100
                  ),
                })
              }
            />
          </label>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button className="btn" disabled={!defaultsDirty || savingDefaults} onClick={saveDefaults}>
            {savingDefaults ? "Saving…" : "Save defaults"}
          </button>
          {defaultsDirty && (
            <button
              className="btn ghost"
              onClick={() => setSettingsDraft(data!.settings)}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Menu items</h3>
          <input
            type="search"
            placeholder="Search flavors & products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", marginBottom: 12 }}
          />
          <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: 480, overflow: "auto" }}>
            {filtered.map((m) => {
              const mats = menuItemCost(m, compById, ingById);
              const active = m.id === selectedId;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    className={active ? "btn" : "btn ghost"}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      marginBottom: 6,
                      display: "block",
                    }}
                    onClick={() => selectItem(m.id)}
                  >
                    <strong>{m.name}</strong>
                    <div className="note-inline">
                      materials {money(mats.perUnit / (m.yieldAmount || 1))}/{m.yieldUnit}
                      {mats.missing.length ? " · missing prices" : ""}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card">
          {!selected || !draft || !quote ? (
            <p className="muted">Select a menu item to open its pricing calculator.</p>
          ) : (
            <>
              <h3 style={{ marginTop: 0 }}>{selected.name}</h3>
              <p className="note-inline">
                Yield {selected.yieldAmount} {selected.yieldUnit}
                {selected.assemblyNotes ? ` · ${selected.assemblyNotes}` : ""}
              </p>

              <h4>Materials</h4>
              <p style={{ margin: "4px 0" }}>
                <strong>{money(quote.materials)}</strong>
                <span className="muted"> / {quote.displayUnit}</span>
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 12px" }}>
                {quote.materialsParts.map((p) => (
                  <li key={p.name} className="note-inline">
                    {p.name}: {money(p.perUnit)}
                  </li>
                ))}
              </ul>

              <h4>Labor &amp; overrides</h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <label>
                  Labor hours
                  <input
                    type="number"
                    min={0}
                    step="0.25"
                    value={draft.laborHours ?? ""}
                    placeholder="not set"
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        laborHours:
                          e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                  />
                </label>
                <label>
                  Margin % {draft.marginPct == null ? "(default)" : "(override)"}
                  <input
                    type="number"
                    min={0}
                    max={99}
                    step="1"
                    value={
                      draft.marginPct == null
                        ? ""
                        : Number((draft.marginPct * 100).toFixed(4))
                    }
                    placeholder={pctLabel(data!.settings.defaultMarginPct)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        marginPct:
                          e.target.value === ""
                            ? null
                            : Math.min(0.99, Math.max(0, Number(e.target.value) || 0) / 100),
                      })
                    }
                  />
                </label>
                <label>
                  Discount % {draft.discountPct == null ? "(default)" : "(override)"}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="1"
                    value={
                      draft.discountPct == null
                        ? ""
                        : Number((draft.discountPct * 100).toFixed(4))
                    }
                    placeholder={pctLabel(data!.settings.defaultDiscountPct)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        discountPct:
                          e.target.value === ""
                            ? null
                            : Math.min(1, Math.max(0, Number(e.target.value) || 0) / 100),
                      })
                    }
                  />
                </label>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => setDraft({ ...draft, laborHours: 0 })}
                >
                  Zero labor
                </button>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => setDraft({ ...draft, marginPct: 0 })}
                >
                  Zero margin
                </button>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => setDraft({ ...draft, discountPct: 0 })}
                >
                  Zero discount
                </button>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      marginPct: null,
                      discountPct: null,
                    })
                  }
                >
                  Clear overrides (use defaults)
                </button>
              </div>

              <h4>Breakdown</h4>
              <table>
                <tbody>
                  <tr>
                    <td>Materials</td>
                    <td className="num">{money(quote.materials)}</td>
                  </tr>
                  <tr>
                    <td>
                      Labor
                      {quote.laborHours != null
                        ? ` (${quote.laborHours} h × ${money(data!.settings.hourlyRate)})`
                        : ""}
                    </td>
                    <td className="num">{money(quote.labor)}</td>
                  </tr>
                  <tr>
                    <td>Base cost</td>
                    <td className="num">{money(quote.baseCost)}</td>
                  </tr>
                  <tr>
                    <td>
                      After margin ({pctLabel(quote.effectiveMarginPct)}
                      {quote.marginInherited ? ", default" : ""})
                    </td>
                    <td className="num">{money(quote.afterMargin)}</td>
                  </tr>
                  <tr>
                    <td>
                      After discount ({pctLabel(quote.effectiveDiscountPct)}
                      {quote.discountInherited ? ", default" : ""})
                    </td>
                    <td className="num">{money(quote.afterDiscount)}</td>
                  </tr>
                  <tr>
                    <td>Tax ({pctLabel(quote.taxPct)})</td>
                    <td className="num">{money(quote.taxAmount)}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Suggested retail</strong>
                    </td>
                    <td className="num">
                      <strong>
                        {formatRetailPerUnit(quote.suggestedRetail, quote.displayUnit)}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                {quote.warnings.map((w) => (
                  <span className="pill warn" key={w}>
                    {w}
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                <button
                  className="btn"
                  disabled={!itemDirty || committing}
                  onClick={commitItem}
                >
                  {committing ? "Saving…" : "Commit to item"}
                </button>
                <button className="btn ghost" disabled={!itemDirty} onClick={resetDraft}>
                  Reset draft
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="note-inline" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="btn ghost sm"
          onClick={() => setShowIngredientPeek((v) => !v)}
        >
          {showIngredientPeek ? "Hide" : "Show"} ingredient price peek
        </button>{" "}
        · <Link to="/library">Edit pack prices in Library</Link>
      </p>
      {showIngredientPeek && (
        <div className="card">
          <p className="note-inline">
            Read-only peek — change pack prices under Library → Ingredients.
          </p>
          <table>
            <thead>
              <tr>
                <th>Ingredient</th>
                <th className="num">Pack $</th>
                <th className="num">Qty</th>
              </tr>
            </thead>
            <tbody>
              {data!.ingredients.slice(0, 40).map((ing) => (
                <tr key={ing.id}>
                  <td>{ing.name}</td>
                  <td className="num">{ing.packPrice != null ? money(ing.packPrice) : "—"}</td>
                  <td className="num muted">
                    {ing.packQty != null ? `${ing.packQty} ${ing.baseUnit}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data!.ingredients.length > 40 && (
            <p className="note-inline">Showing first 40 of {data!.ingredients.length}.</p>
          )}
        </div>
      )}
    </>
  );
}

import { useMemo, useState, type DragEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../state/AppState";
import { scaleQtyText } from "../domain/scaling";
import type { ComponentLine, ComponentType } from "../domain/types";

let blockSeq = 0;

interface BlockState {
  key: number;
  mode: "existing" | "new";
  existingId: string | null;
  name: string;
  type: ComponentType;
  yieldAmount: number;
  yieldUnit: string;
  notes: string;
  lines: ComponentLine[];
}

function newBlock(): BlockState {
  return {
    key: ++blockSeq,
    mode: "new",
    existingId: null,
    name: "",
    type: "cake",
    yieldAmount: 12,
    yieldUnit: "cupcakes",
    notes: "",
    lines: [],
  };
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function ItemBuilderPage() {
  const { data, repo, refresh } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [itemName, setItemName] = useState(params.get("name") ?? "");
  const [flavorTag, setFlavorTag] = useState("");
  const [assemblyNotes, setAssemblyNotes] = useState("");
  const [blocks, setBlocks] = useState<BlockState[]>([newBlock()]);
  const [activeKey, setActiveKey] = useState<number | null>(blocks[0]?.key ?? null);
  const [dragOverKey, setDragOverKey] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [addQty, setAddQty] = useState(24);
  const [addToMenu, setAddToMenu] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ingFilter, setIngFilter] = useState("");

  const ingredients = useMemo(() => {
    const q = ingFilter.trim().toLowerCase();
    const list = data!.ingredients;
    return q ? list.filter((i) => i.name.toLowerCase().includes(q)) : list;
  }, [data, ingFilter]);

  function updateBlock(key: number, patch: Partial<BlockState>) {
    setBlocks((bs) => bs.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  }

  function addIngredientToBlock(key: number, ingredientId: string) {
    const ing = data!.ingredients.find((i) => i.id === ingredientId);
    if (!ing) return;
    setBlocks((bs) =>
      bs.map((b) => {
        if (b.key !== key || b.mode !== "new") return b;
        if (b.lines.some((l) => l.ingredientId === ingredientId)) return b;
        const line: ComponentLine = {
          ingredientId,
          qtyText: "",
          detail: null,
          grams: ing.baseUnit === "g" ? 0 : null,
          count: ing.baseUnit === "count" ? 0 : null,
          sort: b.lines.length,
        };
        return { ...b, lines: [...b.lines, line] };
      })
    );
  }

  function onDrop(e: DragEvent, key: number) {
    e.preventDefault();
    setDragOverKey(null);
    const id = e.dataTransfer.getData("text/ingredient");
    if (id) addIngredientToBlock(key, id);
  }

  function ingName(id: string) {
    return data!.ingredients.find((i) => i.id === id)?.name ?? id;
  }

  async function save() {
    setError(null);
    if (!itemName.trim()) {
      setError("Give the menu item a name.");
      return;
    }
    const usable = blocks.filter(
      (b) =>
        (b.mode === "existing" && b.existingId) ||
        (b.mode === "new" && b.name.trim() && b.lines.length > 0)
    );
    if (usable.length === 0) {
      setError("Add at least one component (a new recipe block or an existing one).");
      return;
    }

    setSaving(true);
    try {
      const itemId = `mi-${slugify(itemName)}`;
      const refs: Array<{ componentId: string; scale: number; sort: number }> = [];

      for (const [i, b] of usable.entries()) {
        if (b.mode === "existing" && b.existingId) {
          refs.push({ componentId: b.existingId, scale: 1, sort: i });
          continue;
        }
        const compId = `comp-${slugify(b.name)}`;
        await repo.upsertComponent({
          id: compId,
          name: b.name.trim(),
          type: b.type,
          yieldAmount: b.yieldAmount,
          yieldUnit: b.yieldUnit,
          notes: b.notes.trim() || null,
          lines: b.lines.map((l, j) => ({ ...l, sort: j })),
        });
        refs.push({ componentId: compId, scale: 1, sort: i });
      }

      await repo.upsertMenuItem({
        id: itemId,
        name: itemName.trim(),
        flavorTag: flavorTag.trim() || null,
        isPrimary: false,
        isPlaceholder: false,
        assemblyNotes: assemblyNotes.trim() || null,
        components: refs,
      });

      if (addToMenu && addQty > 0) {
        await repo.setMenuQuantity(itemId, addQty);
      }
      await refresh();
      navigate(addToMenu ? "/current-menu" : "/library");
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <p className="eyebrow">Section B · MenuItemBuilder</p>
      <h1>Create a new menu item.</h1>
      <p className="muted">
        Name the item, build its components from raw ingredients (drag from the master
        list, or click +), or reuse an existing component like Standard Buttercream. This
        is how a rotating flavor gets added — no pre-built catalog required.
      </p>

      <div className="builder-layout">
        <div className="card master-list no-print">
          <h3>Raw ingredients</h3>
          <input
            type="search"
            placeholder="Filter…"
            value={ingFilter}
            onChange={(e) => setIngFilter(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          {ingredients.map((ing) => (
            <div
              key={ing.id}
              className="ing-row"
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/ingredient", ing.id)}
              title="Drag onto a component block, or click + to add to the active block"
            >
              <span>{ing.name}</span>
              <button
                className="btn ghost sm"
                onClick={() => activeKey != null && addIngredientToBlock(activeKey, ing.id)}
              >
                +
              </button>
            </div>
          ))}
        </div>

        <div>
          <div className="card">
            <div className="grid grid-2">
              <label>
                Menu item name
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Chocolate Red Wine Cupcake"
                />
              </label>
              <label>
                Flavor tag
                <input
                  type="text"
                  value={flavorTag}
                  onChange={(e) => setFlavorTag(e.target.value)}
                  placeholder="e.g. rotating"
                />
              </label>
            </div>
            <label style={{ display: "block", marginTop: 10 }}>
              Assembly notes
              <textarea
                rows={2}
                value={assemblyNotes}
                onChange={(e) => setAssemblyNotes(e.target.value)}
                placeholder="How the components come together…"
              />
            </label>
            <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
              <span className="note-inline">Preview scale (recipes stay saved at 1×):</span>
              <div className="btn-group">
                {[1, 2, 3].map((s) => (
                  <button
                    key={s}
                    className={scale === s ? "active" : ""}
                    onClick={() => setScale(s)}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>
          </div>

          {blocks.map((b) => (
            <div
              key={b.key}
              className={`component-block${dragOverKey === b.key ? " drag-over" : ""}${
                activeKey === b.key ? "" : ""
              }`}
              onClick={() => setActiveKey(b.key)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverKey(b.key);
              }}
              onDragLeave={() => setDragOverKey(null)}
              onDrop={(e) => onDrop(e, b.key)}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span className="pill">{activeKey === b.key ? "active block" : "block"}</span>
                <select
                  value={b.mode}
                  onChange={(e) =>
                    updateBlock(b.key, { mode: e.target.value as "existing" | "new" })
                  }
                  style={{ width: "auto" }}
                >
                  <option value="new">New component recipe</option>
                  <option value="existing">Use existing component</option>
                </select>
                <button
                  className="btn ghost sm"
                  style={{ marginLeft: "auto" }}
                  onClick={() => setBlocks((bs) => bs.filter((x) => x.key !== b.key))}
                >
                  Remove block
                </button>
              </div>

              {b.mode === "existing" ? (
                <label style={{ display: "block", marginTop: 10 }}>
                  Component
                  <select
                    value={b.existingId ?? ""}
                    onChange={(e) => updateBlock(b.key, { existingId: e.target.value || null })}
                  >
                    <option value="">Choose…</option>
                    {data!.components.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.yieldAmount} {c.yieldUnit}/batch)
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <>
                  <div className="grid grid-2" style={{ marginTop: 10 }}>
                    <label>
                      Component name
                      <input
                        type="text"
                        value={b.name}
                        onChange={(e) => updateBlock(b.key, { name: e.target.value })}
                        placeholder="e.g. Red Wine Ganache"
                      />
                    </label>
                    <label>
                      Type
                      <select
                        value={b.type}
                        onChange={(e) =>
                          updateBlock(b.key, { type: e.target.value as ComponentType })
                        }
                      >
                        {["cake", "frosting", "filling", "topping", "dough", "other"].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Yield per batch
                      <input
                        type="number"
                        min={1}
                        value={b.yieldAmount}
                        onChange={(e) =>
                          updateBlock(b.key, { yieldAmount: Number(e.target.value) || 1 })
                        }
                      />
                    </label>
                    <label>
                      Yield unit
                      <input
                        type="text"
                        value={b.yieldUnit}
                        onChange={(e) => updateBlock(b.key, { yieldUnit: e.target.value })}
                        placeholder="cupcakes"
                      />
                    </label>
                  </div>

                  {b.lines.length === 0 && (
                    <p className="note-inline" style={{ marginTop: 10 }}>
                      Drag raw ingredients here (or click + in the master list).
                    </p>
                  )}
                  {b.lines.map((l, i) => {
                    const ing = data!.ingredients.find((x) => x.id === l.ingredientId);
                    const isCount = ing?.baseUnit === "count";
                    return (
                      <div className="line-row" key={`${l.ingredientId}-${i}`}>
                        <span>
                          <strong>{ingName(l.ingredientId)}</strong>
                        </span>
                        <input
                          type="text"
                          placeholder={isCount ? "e.g. 3" : 'e.g. "1 3/4 cups"'}
                          value={scale === 1 ? l.qtyText : scaleQtyText(l.qtyText, scale)}
                          disabled={scale !== 1}
                          onChange={(e) => {
                            const lines = [...b.lines];
                            lines[i] = { ...l, qtyText: e.target.value };
                            updateBlock(b.key, { lines });
                          }}
                        />
                        <input
                          type="number"
                          min={0}
                          step="any"
                          placeholder={isCount ? "count" : "grams"}
                          value={(isCount ? l.count : l.grams) ?? ""}
                          disabled={scale !== 1}
                          onChange={(e) => {
                            const v = e.target.value === "" ? null : Number(e.target.value);
                            const lines = [...b.lines];
                            lines[i] = isCount ? { ...l, count: v } : { ...l, grams: v };
                            updateBlock(b.key, { lines });
                          }}
                        />
                        <button
                          className="btn ghost sm"
                          onClick={() =>
                            updateBlock(b.key, { lines: b.lines.filter((_, j) => j !== i) })
                          }
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                  {scale !== 1 && (
                    <p className="note-inline" style={{ marginTop: 8 }}>
                      Showing quantities at {scale}× — switch back to 1× to edit.
                    </p>
                  )}
                </>
              )}
            </div>
          ))}

          <div className="no-print" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              className="btn ghost"
              onClick={() => {
                const b = newBlock();
                setBlocks((bs) => [...bs, b]);
                setActiveKey(b.key);
              }}
            >
              + Add component block
            </button>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={addToMenu}
                  onChange={(e) => setAddToMenu(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "var(--berry)" }}
                />
                Add to current menu
              </label>
              {addToMenu && (
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  Quantity
                  <input
                    type="number"
                    min={1}
                    value={addQty}
                    onChange={(e) => setAddQty(Math.max(1, Number(e.target.value) || 1))}
                    style={{ width: 90 }}
                  />
                </label>
              )}
              <button className="btn" onClick={save} disabled={saving} style={{ marginLeft: "auto" }}>
                {saving
                  ? "Saving…"
                  : addToMenu
                  ? "Save + add to current menu"
                  : "Save menu item"}
              </button>
            </div>
            {error && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}
          </div>
        </div>
      </div>
    </>
  );
}

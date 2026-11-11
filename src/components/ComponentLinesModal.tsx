import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { lineUnitMismatch } from "../domain/aggregate";
import type {
  BaseUnit,
  ComponentLine,
  ItemComponent,
  RawIngredient,
} from "../domain/types";
import { useApp } from "../state/AppState";

const ING_CATEGORIES = ["dry", "wet", "dairy", "produce", "flavor", "other"] as const;

type DraftLine = {
  key: string;
  ingredientId: string;
  qtyText: string;
  detail: string;
  grams: string;
  count: string;
  tsp: string;
};

type DraftComponent = {
  id: string;
  lines: DraftLine[];
};

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function newKey(): string {
  return `line-${Math.random().toString(36).slice(2, 10)}`;
}

function lineToDraft(line: ComponentLine): DraftLine {
  return {
    key: newKey(),
    ingredientId: line.ingredientId,
    qtyText: line.qtyText,
    detail: line.detail ?? "",
    grams: line.grams != null ? String(line.grams) : "",
    count: line.count != null ? String(line.count) : "",
    tsp: line.tsp != null ? String(line.tsp) : "",
  };
}

function emptyLine(): DraftLine {
  return {
    key: newKey(),
    ingredientId: "",
    qtyText: "",
    detail: "",
    grams: "",
    count: "",
    tsp: "",
  };
}

function snapshotFromComponents(components: ItemComponent[]): DraftComponent[] {
  return components.map((c) => ({
    id: c.id,
    lines: c.lines.map(lineToDraft),
  }));
}

function serializeDraft(draft: DraftComponent[]): string {
  return JSON.stringify(
    draft.map((c) => ({
      id: c.id,
      lines: c.lines.map((l) => ({
        ingredientId: l.ingredientId,
        qtyText: l.qtyText,
        detail: l.detail,
        grams: l.grams,
        count: l.count,
        tsp: l.tsp,
      })),
    }))
  );
}

function parseOptionalNumber(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function draftToLines(lines: DraftLine[]): ComponentLine[] {
  return lines.map((l, i) => ({
    ingredientId: l.ingredientId,
    qtyText: l.qtyText.trim(),
    detail: l.detail.trim() || null,
    grams: parseOptionalNumber(l.grams),
    count: parseOptionalNumber(l.count),
    tsp: parseOptionalNumber(l.tsp),
    sort: i,
  }));
}

function costQtyForUnit(line: DraftLine, baseUnit: BaseUnit): string {
  if (baseUnit === "count") return line.count;
  if (baseUnit === "tsp") return line.tsp;
  return line.grams;
}

function withCostQty(line: DraftLine, baseUnit: BaseUnit, value: string): DraftLine {
  if (baseUnit === "count") {
    return { ...line, count: value, grams: "", tsp: "" };
  }
  if (baseUnit === "tsp") {
    return { ...line, tsp: value, grams: "", count: "" };
  }
  return { ...line, grams: value, count: "", tsp: "" };
}

function validateLine(
  line: DraftLine,
  ingredients: Map<string, RawIngredient>
): string | null {
  if (!line.ingredientId) return "Pick an ingredient.";
  if (!line.qtyText.trim()) return "Kitchen label is required.";
  const ing = ingredients.get(line.ingredientId);
  if (!ing) return "Unknown ingredient.";
  const qty = costQtyForUnit(line, ing.baseUnit).trim();
  if (!qty) return `Enter amount in ${ing.baseUnit}.`;
  const n = Number(qty);
  if (!Number.isFinite(n) || n < 0) return `Invalid ${ing.baseUnit} amount.`;
  return null;
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M11.5 2.5l2 2L5.75 12.25 3.5 12.75l.5-2.25L11.5 2.5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M10.25 3.75l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IngredientPicker({
  value,
  onChange,
  ingredients,
}: {
  value: string;
  onChange: (id: string) => void;
  ingredients: RawIngredient[];
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = ingredients.find((i) => i.id === value);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter((i) => i.name.toLowerCase().includes(q));
  }, [ingredients, filter]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="ing-picker" ref={wrapRef}>
      <button
        type="button"
        className="ing-picker-trigger"
        onClick={() => {
          setOpen((o) => !o);
          setFilter("");
        }}
      >
        <span>{selected?.name ?? "Select ingredient…"}</span>
        <span className="muted">{selected?.baseUnit ?? ""}</span>
      </button>
      {open && (
        <div className="ing-picker-dropdown">
          <input
            type="search"
            placeholder="Search library…"
            value={filter}
            autoFocus
            onChange={(e) => setFilter(e.target.value)}
          />
          <ul className="ing-picker-list">
            {filtered.map((ing) => (
              <li key={ing.id}>
                <button
                  type="button"
                  className={ing.id === value ? "active" : ""}
                  onClick={() => {
                    onChange(ing.id);
                    setOpen(false);
                  }}
                >
                  {ing.name}
                  <span className="muted">{ing.baseUnit}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="muted" style={{ padding: "10px 8px" }}>
                No ingredients match.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function NewIngredientForm({
  onCreated,
  onCancel,
}: {
  onCreated: (ing: RawIngredient) => void;
  onCancel: () => void;
}) {
  const { data, repo, refresh } = useApp();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [baseUnit, setBaseUnit] = useState<BaseUnit>("g");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    const id = slugify(trimmed);
    if (!id) {
      setError("Name needs letters or numbers.");
      return;
    }
    const existing = data!.ingredients.find((i) => i.id === id);
    if (existing) {
      onCreated(existing);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const ing: RawIngredient = {
        id,
        name: trimmed,
        category,
        baseUnit,
        suggestedStore: null,
        packageSize: null,
        roundTo: null,
        roundLabel: null,
        packPrice: null,
        packQty: null,
        packQtyUnit: null,
      };
      await repo.upsertIngredient(ing);
      await refresh();
      onCreated(ing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create ingredient.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="new-ing-form" onSubmit={(e) => void submit(e)}>
      <p className="eyebrow" style={{ margin: 0 }}>
        New ingredient
      </p>
      <div className="new-ing-grid">
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vanilla bean paste"
            autoFocus
          />
        </label>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {ING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Base unit
          <select
            value={baseUnit}
            onChange={(e) => setBaseUnit(e.target.value as BaseUnit)}
          >
            <option value="g">g (weight)</option>
            <option value="count">count</option>
            <option value="tsp">tsp</option>
          </select>
        </label>
      </div>
      {error && <p className="modal-alert warn">{error}</p>}
      <div className="modal-footer-actions">
        <button type="button" className="btn ghost sm" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn sm" disabled={saving}>
          {saving ? "Creating…" : "Create & select"}
        </button>
      </div>
    </form>
  );
}

export function ComponentLinesModal({
  components,
  title,
  sharedNote,
  onClose,
}: {
  components: ItemComponent[];
  title: string;
  sharedNote?: boolean;
  onClose: () => void;
}) {
  const { data, repo, refresh } = useApp();
  const [draft, setDraft] = useState(() => snapshotFromComponents(components));
  const [baseline] = useState(() => serializeDraft(snapshotFromComponents(components)));
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newIngFor, setNewIngFor] = useState<{ componentId: string; lineKey: string } | null>(
    null
  );

  const ingredients = data!.ingredients;
  const ingById = useMemo(
    () => new Map(ingredients.map((i) => [i.id, i])),
    [ingredients]
  );
  const compById = useMemo(
    () => new Map(components.map((c) => [c.id, c])),
    [components]
  );

  const dirty = serializeDraft(draft) !== baseline;

  const lineErrors = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of draft) {
      for (const line of c.lines) {
        const err = validateLine(line, ingById);
        if (err) map.set(line.key, err);
      }
    }
    return map;
  }, [draft, ingById]);

  const canSave = dirty && lineErrors.size === 0 && !saving;

  function requestClose() {
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      if (newIngFor) {
        setNewIngFor(null);
        return;
      }
      if (confirmDiscard) {
        setConfirmDiscard(false);
        return;
      }
      if (dirty) {
        setConfirmDiscard(true);
        return;
      }
      onClose();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [dirty, confirmDiscard, newIngFor, onClose]);

  function updateLine(
    componentId: string,
    lineKey: string,
    updater: (line: DraftLine) => DraftLine
  ) {
    setConfirmDiscard(false);
    setDraft((prev) =>
      prev.map((c) =>
        c.id !== componentId
          ? c
          : { ...c, lines: c.lines.map((l) => (l.key === lineKey ? updater(l) : l)) }
      )
    );
  }

  function setIngredient(componentId: string, lineKey: string, ingredientId: string) {
    updateLine(componentId, lineKey, (l) => {
      const next = { ...l, ingredientId, grams: "", count: "", tsp: "" };
      const ing = ingById.get(ingredientId);
      if (!ing) return next;
      // Keep any existing cost qty that matches the new unit if user re-picks.
      return withCostQty(next, ing.baseUnit, costQtyForUnit(l, ing.baseUnit));
    });
  }

  function addLine(componentId: string) {
    setConfirmDiscard(false);
    setDraft((prev) =>
      prev.map((c) => (c.id === componentId ? { ...c, lines: [...c.lines, emptyLine()] } : c))
    );
  }

  function removeLine(componentId: string, lineKey: string) {
    setConfirmDiscard(false);
    setDraft((prev) =>
      prev.map((c) =>
        c.id !== componentId ? c : { ...c, lines: c.lines.filter((l) => l.key !== lineKey) }
      )
    );
  }

  function moveLine(componentId: string, lineKey: string, dir: -1 | 1) {
    setConfirmDiscard(false);
    setDraft((prev) =>
      prev.map((c) => {
        if (c.id !== componentId) return c;
        const idx = c.lines.findIndex((l) => l.key === lineKey);
        const nextIdx = idx + dir;
        if (idx < 0 || nextIdx < 0 || nextIdx >= c.lines.length) return c;
        const lines = c.lines.slice();
        const [row] = lines.splice(idx, 1);
        lines.splice(nextIdx, 0, row);
        return { ...c, lines };
      })
    );
  }

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      for (const c of draft) {
        const original = compById.get(c.id);
        if (!original) continue;
        await repo.upsertComponent({
          ...original,
          lines: draftToLines(c.lines),
        });
      }
      await refresh();
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={requestClose}>
      <div
        className="modal-panel modal-panel-edit"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-lines-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>
              Edit ingredients
            </p>
            <h2 id="edit-lines-title" style={{ margin: "4px 0 0" }}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="btn ghost sm"
            onClick={requestClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {sharedNote && (
          <p className="note-inline" style={{ marginTop: 10 }}>
            Shared components (frosting, filling, etc.) update every menu item that uses them.
          </p>
        )}

        {dirty && !confirmDiscard && (
          <p className="modal-alert info" role="status">
            Unsaved changes.
          </p>
        )}

        <div className="edit-lines-scroller">
          {draft.map((dc) => {
            const meta = compById.get(dc.id);
            return (
              <section key={dc.id} className="edit-comp-section">
                <div className="edit-comp-heading">
                  <div>
                    <p className="eyebrow" style={{ marginBottom: 2 }}>
                      {meta?.category ?? "component"}
                    </p>
                    <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{meta?.name ?? dc.id}</h3>
                    {meta && (
                      <p className="note-inline" style={{ margin: "4px 0 0" }}>
                        1 batch → {meta.yieldAmount} {meta.yieldUnit}
                      </p>
                    )}
                  </div>
                </div>

                <ul className="edit-lines-list">
                  {dc.lines.map((line, idx) => {
                    const ing = ingById.get(line.ingredientId);
                    const baseUnit = ing?.baseUnit ?? "g";
                    const costQty = costQtyForUnit(line, baseUnit);
                    const hardErr = lineErrors.get(line.key);
                    const soft =
                      ing &&
                      lineUnitMismatch(
                        {
                          qtyText: line.qtyText,
                          grams: parseOptionalNumber(line.grams),
                          count: parseOptionalNumber(line.count),
                          tsp: parseOptionalNumber(line.tsp),
                        },
                        ing.baseUnit
                      );
                    return (
                      <li key={line.key} className="edit-line-row">
                        <div className="edit-line-main">
                          <IngredientPicker
                            value={line.ingredientId}
                            ingredients={ingredients}
                            onChange={(id) => setIngredient(dc.id, line.key, id)}
                          />
                          <input
                            type="text"
                            className="edit-line-qty-text"
                            placeholder="Kitchen label (e.g. 225 g)"
                            value={line.qtyText}
                            onChange={(e) =>
                              updateLine(dc.id, line.key, (l) => ({
                                ...l,
                                qtyText: e.target.value,
                              }))
                            }
                          />
                          <input
                            type="text"
                            className="edit-line-detail"
                            placeholder="Detail (optional)"
                            value={line.detail}
                            onChange={(e) =>
                              updateLine(dc.id, line.key, (l) => ({
                                ...l,
                                detail: e.target.value,
                              }))
                            }
                          />
                          <label className="edit-line-cost">
                            <span className="note-inline">
                              Cost qty ({baseUnit})
                            </span>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={costQty}
                              disabled={!ing}
                              onChange={(e) =>
                                updateLine(dc.id, line.key, (l) =>
                                  withCostQty(l, baseUnit, e.target.value)
                                )
                              }
                            />
                          </label>
                        </div>
                        <div className="edit-line-actions">
                          <button
                            type="button"
                            className="btn ghost sm"
                            disabled={idx === 0}
                            onClick={() => moveLine(dc.id, line.key, -1)}
                            aria-label="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="btn ghost sm"
                            disabled={idx === dc.lines.length - 1}
                            onClick={() => moveLine(dc.id, line.key, 1)}
                            aria-label="Move down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="btn ghost sm"
                            onClick={() => removeLine(dc.id, line.key)}
                            aria-label="Remove line"
                          >
                            Remove
                          </button>
                        </div>
                        {hardErr && <p className="modal-alert warn sm">{hardErr}</p>}
                        {!hardErr && soft && (
                          <p className="modal-alert warn sm">{soft}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {dc.lines.length === 0 && (
                  <p className="muted" style={{ margin: "8px 0" }}>
                    No ingredient lines yet.
                  </p>
                )}

                <div className="edit-comp-toolbar">
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => addLine(dc.id)}
                  >
                    Add line
                  </button>
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => {
                      const line = emptyLine();
                      setConfirmDiscard(false);
                      setDraft((prev) =>
                        prev.map((c) =>
                          c.id === dc.id ? { ...c, lines: [...c.lines, line] } : c
                        )
                      );
                      setNewIngFor({ componentId: dc.id, lineKey: line.key });
                    }}
                  >
                    New ingredient
                  </button>
                </div>

                {newIngFor?.componentId === dc.id && (
                  <NewIngredientForm
                    onCancel={() => setNewIngFor(null)}
                    onCreated={(ing) => {
                      setIngredient(dc.id, newIngFor.lineKey, ing.id);
                      setNewIngFor(null);
                    }}
                  />
                )}
              </section>
            );
          })}
        </div>

        {saveError && <p className="modal-alert warn">{saveError}</p>}

        {confirmDiscard ? (
          <div className="modal-alert warn discard-alert" role="alertdialog" aria-labelledby="discard-title">
            <p id="discard-title" style={{ margin: "0 0 10px", fontWeight: 700 }}>
              Discard unsaved changes?
            </p>
            <div className="modal-footer-actions">
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => setConfirmDiscard(false)}
              >
                Keep editing
              </button>
              <button type="button" className="btn sm" onClick={onClose}>
                Discard
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-footer-actions" style={{ marginTop: 14 }}>
            <button type="button" className="btn ghost sm" onClick={requestClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn sm"
              disabled={!canSave}
              onClick={() => void save()}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { PencilIcon };

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { lineUnitMismatch } from "../domain/aggregate";
import type {
  BaseUnit,
  ComponentLine,
  ItemComponent,
  MenuItem,
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

type DraftSlot = {
  key: string;
  componentId: string;
  scale: string;
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
  return `k-${Math.random().toString(36).slice(2, 10)}`;
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

function slotFromComponent(comp: ItemComponent, scale = 1): DraftSlot {
  return {
    key: newKey(),
    componentId: comp.id,
    scale: String(scale),
    lines: comp.lines.map(lineToDraft),
  };
}

function snapshotSlots(
  components: ItemComponent[],
  menuItem: MenuItem | null | undefined,
  library: Map<string, ItemComponent>
): DraftSlot[] {
  if (menuItem) {
    return menuItem.components.map((ref) => {
      const comp = library.get(ref.componentId);
      if (comp) return slotFromComponent(comp, ref.scale);
      return {
        key: newKey(),
        componentId: ref.componentId,
        scale: String(ref.scale),
        lines: [],
      };
    });
  }
  return components.map((c) => slotFromComponent(c, 1));
}

function serializeDraft(draft: DraftSlot[], includeComposition: boolean): string {
  return JSON.stringify(
    draft.map((c) => ({
      componentId: includeComposition ? c.componentId : undefined,
      scale: includeComposition ? c.scale : undefined,
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

function linesEqual(a: ComponentLine[], b: DraftLine[]): boolean {
  const left = a.map((l) => ({
    ingredientId: l.ingredientId,
    qtyText: l.qtyText,
    detail: l.detail ?? "",
    grams: l.grams != null ? String(l.grams) : "",
    count: l.count != null ? String(l.count) : "",
    tsp: l.tsp != null ? String(l.tsp) : "",
  }));
  const right = b.map((l) => ({
    ingredientId: l.ingredientId,
    qtyText: l.qtyText,
    detail: l.detail,
    grams: l.grams,
    count: l.count,
    tsp: l.tsp,
  }));
  return JSON.stringify(left) === JSON.stringify(right);
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

function SearchPicker<T extends { id: string; name: string }>({
  value,
  items,
  onChange,
  placeholder,
  secondary,
}: {
  value: string;
  items: T[];
  onChange: (id: string) => void;
  placeholder: string;
  secondary?: (item: T) => string;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = items.find((i) => i.id === value);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, filter]);

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
        <span>{selected?.name ?? placeholder}</span>
        <span className="muted">{selected && secondary ? secondary(selected) : ""}</span>
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
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={item.id === value ? "active" : ""}
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                >
                  {item.name}
                  {secondary && <span className="muted">{secondary(item)}</span>}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="muted" style={{ padding: "10px 8px" }}>
                No matches.
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
  menuItem,
  onClose,
}: {
  components: ItemComponent[];
  title: string;
  sharedNote?: boolean;
  menuItem?: MenuItem | null;
  onClose: () => void;
}) {
  const { data, repo, refresh } = useApp();
  const editComposition = !!menuItem;

  const libraryById = useMemo(
    () => new Map(data!.components.map((c) => [c.id, c])),
    [data]
  );

  const [draft, setDraft] = useState(() =>
    snapshotSlots(components, menuItem, libraryById)
  );
  const [baseline] = useState(() =>
    serializeDraft(snapshotSlots(components, menuItem, libraryById), editComposition)
  );
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newIngFor, setNewIngFor] = useState<{ slotKey: string; lineKey: string } | null>(
    null
  );

  const ingredients = data!.ingredients;
  const allComponents = data!.components;
  const ingById = useMemo(
    () => new Map(ingredients.map((i) => [i.id, i])),
    [ingredients]
  );

  const dirty = serializeDraft(draft, editComposition) !== baseline;

  const lineErrors = useMemo(() => {
    const map = new Map<string, string>();
    for (const slot of draft) {
      for (const line of slot.lines) {
        const err = validateLine(line, ingById);
        if (err) map.set(line.key, err);
      }
    }
    return map;
  }, [draft, ingById]);

  const compositionError = useMemo(() => {
    if (!editComposition) return null;
    if (draft.length === 0) return "Add at least one component.";
    const ids = draft.map((s) => s.componentId);
    if (ids.some((id) => !id)) return "Every slot needs a component.";
    if (new Set(ids).size !== ids.length) return "Duplicate components aren’t allowed.";
    for (const slot of draft) {
      const scale = Number(slot.scale);
      if (!Number.isFinite(scale) || scale <= 0) return "Scale must be a positive number.";
    }
    return null;
  }, [draft, editComposition]);

  const canSave =
    dirty && lineErrors.size === 0 && !compositionError && !saving;

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

  function touchDraft(updater: (prev: DraftSlot[]) => DraftSlot[]) {
    setConfirmDiscard(false);
    setDraft(updater);
  }

  function updateLine(
    slotKey: string,
    lineKey: string,
    updater: (line: DraftLine) => DraftLine
  ) {
    touchDraft((prev) =>
      prev.map((s) =>
        s.key !== slotKey
          ? s
          : { ...s, lines: s.lines.map((l) => (l.key === lineKey ? updater(l) : l)) }
      )
    );
  }

  function setIngredient(slotKey: string, lineKey: string, ingredientId: string) {
    updateLine(slotKey, lineKey, (l) => {
      const next = { ...l, ingredientId, grams: "", count: "", tsp: "" };
      const ing = ingById.get(ingredientId);
      if (!ing) return next;
      return withCostQty(next, ing.baseUnit, costQtyForUnit(l, ing.baseUnit));
    });
  }

  function swapComponent(slotKey: string, componentId: string) {
    const comp = libraryById.get(componentId);
    touchDraft((prev) =>
      prev.map((s) => {
        if (s.key !== slotKey) return s;
        if (!comp) return { ...s, componentId, lines: [] };
        return {
          ...s,
          componentId,
          lines: comp.lines.map(lineToDraft),
        };
      })
    );
  }

  function addLine(slotKey: string) {
    touchDraft((prev) =>
      prev.map((s) => (s.key === slotKey ? { ...s, lines: [...s.lines, emptyLine()] } : s))
    );
  }

  function removeLine(slotKey: string, lineKey: string) {
    touchDraft((prev) =>
      prev.map((s) =>
        s.key !== slotKey ? s : { ...s, lines: s.lines.filter((l) => l.key !== lineKey) }
      )
    );
  }

  function moveLine(slotKey: string, lineKey: string, dir: -1 | 1) {
    touchDraft((prev) =>
      prev.map((s) => {
        if (s.key !== slotKey) return s;
        const idx = s.lines.findIndex((l) => l.key === lineKey);
        const nextIdx = idx + dir;
        if (idx < 0 || nextIdx < 0 || nextIdx >= s.lines.length) return s;
        const lines = s.lines.slice();
        const [row] = lines.splice(idx, 1);
        lines.splice(nextIdx, 0, row);
        return { ...s, lines };
      })
    );
  }

  function moveSlot(slotKey: string, dir: -1 | 1) {
    touchDraft((prev) => {
      const idx = prev.findIndex((s) => s.key === slotKey);
      const nextIdx = idx + dir;
      if (idx < 0 || nextIdx < 0 || nextIdx >= prev.length) return prev;
      const next = prev.slice();
      const [row] = next.splice(idx, 1);
      next.splice(nextIdx, 0, row);
      return next;
    });
  }

  function addComponentSlot() {
    const unused = allComponents.find(
      (c) => !draft.some((s) => s.componentId === c.id)
    );
    if (!unused) return;
    touchDraft((prev) => [...prev, slotFromComponent(unused, 1)]);
  }

  function removeSlot(slotKey: string) {
    touchDraft((prev) => prev.filter((s) => s.key !== slotKey));
  }

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      const seen = new Set<string>();
      for (const slot of draft) {
        if (seen.has(slot.componentId)) continue;
        seen.add(slot.componentId);
        const original = libraryById.get(slot.componentId);
        if (!original) continue;
        if (linesEqual(original.lines, slot.lines)) continue;
        await repo.upsertComponent({
          ...original,
          lines: draftToLines(slot.lines),
        });
      }

      if (editComposition && menuItem) {
        const nextRefs = draft.map((s, i) => ({
          componentId: s.componentId,
          scale: Number(s.scale) || 1,
          sort: i,
        }));
        const prevRefs = menuItem.components.map((c, i) => ({
          componentId: c.componentId,
          scale: c.scale,
          sort: i,
        }));
        if (JSON.stringify(nextRefs) !== JSON.stringify(prevRefs)) {
          await repo.upsertMenuItem({
            ...menuItem,
            components: nextRefs,
          });
        }
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
              {editComposition ? "Edit recipe" : "Edit ingredients"}
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
            Changing a shared component’s ingredients updates every menu item that uses it.
            Swapping which component is linked only affects this menu item.
          </p>
        )}

        {dirty && !confirmDiscard && (
          <p className="modal-alert info" role="status">
            Unsaved changes.
          </p>
        )}

        <div className="edit-lines-scroller">
          {draft.map((slot, slotIdx) => {
            const meta = libraryById.get(slot.componentId);
            return (
              <section key={slot.key} className="edit-comp-section">
                <div className="edit-comp-heading">
                  {editComposition ? (
                    <div className="edit-comp-pick-row">
                      <div className="edit-comp-pick">
                        <p className="eyebrow" style={{ marginBottom: 4 }}>
                          Component
                        </p>
                        <SearchPicker
                          value={slot.componentId}
                          items={allComponents}
                          placeholder="Select component…"
                          secondary={(c) => c.category}
                          onChange={(id) => swapComponent(slot.key, id)}
                        />
                      </div>
                      <label className="edit-line-cost edit-comp-scale">
                        <span className="note-inline">Scale</span>
                        <input
                          type="number"
                          min={0.01}
                          step="any"
                          value={slot.scale}
                          onChange={(e) =>
                            touchDraft((prev) =>
                              prev.map((s) =>
                                s.key === slot.key ? { ...s, scale: e.target.value } : s
                              )
                            )
                          }
                        />
                      </label>
                      <div className="edit-line-actions edit-comp-slot-actions">
                        <button
                          type="button"
                          className="btn ghost sm"
                          disabled={slotIdx === 0}
                          onClick={() => moveSlot(slot.key, -1)}
                          aria-label="Move component up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="btn ghost sm"
                          disabled={slotIdx === draft.length - 1}
                          onClick={() => moveSlot(slot.key, 1)}
                          aria-label="Move component down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => removeSlot(slot.key)}
                          aria-label="Remove component"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="eyebrow" style={{ marginBottom: 2 }}>
                        {meta?.category ?? "component"}
                      </p>
                      <h3 style={{ margin: 0, fontSize: "1.05rem" }}>
                        {meta?.name ?? slot.componentId}
                      </h3>
                    </div>
                  )}
                  {meta && (
                    <p className="note-inline" style={{ margin: "6px 0 0" }}>
                      1 batch → {meta.yieldAmount} {meta.yieldUnit}
                      {editComposition && Number(slot.scale) !== 1
                        ? ` · used at ${slot.scale}×`
                        : ""}
                    </p>
                  )}
                </div>

                <ul className="edit-lines-list">
                  {slot.lines.map((line, idx) => {
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
                          <SearchPicker
                            value={line.ingredientId}
                            items={ingredients}
                            placeholder="Select ingredient…"
                            secondary={(i) => i.baseUnit}
                            onChange={(id) => setIngredient(slot.key, line.key, id)}
                          />
                          <input
                            type="text"
                            className="edit-line-qty-text"
                            placeholder="Kitchen label (e.g. 225 g)"
                            value={line.qtyText}
                            onChange={(e) =>
                              updateLine(slot.key, line.key, (l) => ({
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
                              updateLine(slot.key, line.key, (l) => ({
                                ...l,
                                detail: e.target.value,
                              }))
                            }
                          />
                          <label className="edit-line-cost">
                            <span className="note-inline">Cost qty ({baseUnit})</span>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={costQty}
                              disabled={!ing}
                              onChange={(e) =>
                                updateLine(slot.key, line.key, (l) =>
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
                            onClick={() => moveLine(slot.key, line.key, -1)}
                            aria-label="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="btn ghost sm"
                            disabled={idx === slot.lines.length - 1}
                            onClick={() => moveLine(slot.key, line.key, 1)}
                            aria-label="Move down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="btn ghost sm"
                            onClick={() => removeLine(slot.key, line.key)}
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

                {slot.lines.length === 0 && (
                  <p className="muted" style={{ margin: "8px 0" }}>
                    No ingredient lines yet.
                  </p>
                )}

                <div className="edit-comp-toolbar">
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => addLine(slot.key)}
                  >
                    Add line
                  </button>
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => {
                      const line = emptyLine();
                      touchDraft((prev) =>
                        prev.map((s) =>
                          s.key === slot.key ? { ...s, lines: [...s.lines, line] } : s
                        )
                      );
                      setNewIngFor({ slotKey: slot.key, lineKey: line.key });
                    }}
                  >
                    New ingredient
                  </button>
                </div>

                {newIngFor?.slotKey === slot.key && (
                  <NewIngredientForm
                    onCancel={() => setNewIngFor(null)}
                    onCreated={(ing) => {
                      setIngredient(slot.key, newIngFor.lineKey, ing.id);
                      setNewIngFor(null);
                    }}
                  />
                )}
              </section>
            );
          })}
        </div>

        {editComposition && (
          <div className="edit-comp-toolbar" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn ghost sm"
              onClick={addComponentSlot}
              disabled={allComponents.every((c) =>
                draft.some((s) => s.componentId === c.id)
              )}
            >
              Add component
            </button>
          </div>
        )}

        {compositionError && <p className="modal-alert warn">{compositionError}</p>}
        {saveError && <p className="modal-alert warn">{saveError}</p>}

        {confirmDiscard ? (
          <div
            className="modal-alert warn discard-alert"
            role="alertdialog"
            aria-labelledby="discard-title"
          >
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

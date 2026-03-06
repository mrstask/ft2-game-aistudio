import { useMemo, useState } from 'react';
import { DevModeLayout } from './DevModeLayout';
import { CHARACTER_STORAGE_KEY, DEFAULT_CHARACTER_DATA, ITEM_CATALOG, itemById, type CharacterEditorData } from './data';

function loadCharacter(): CharacterEditorData {
  try {
    const raw = localStorage.getItem(CHARACTER_STORAGE_KEY);
    if (!raw) return DEFAULT_CHARACTER_DATA;
    const parsed = JSON.parse(raw) as CharacterEditorData;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_CHARACTER_DATA;
    return {
      ...DEFAULT_CHARACTER_DATA,
      ...parsed,
      itemIds: Array.isArray(parsed.itemIds) ? parsed.itemIds : DEFAULT_CHARACTER_DATA.itemIds,
    };
  } catch {
    return DEFAULT_CHARACTER_DATA;
  }
}

export function CharacterPreviewPage() {
  const [version, setVersion] = useState(0);
  const character = useMemo(() => loadCharacter(), [version]);
  const equipped = character.itemIds.map((id) => itemById(id)).filter(Boolean);

  const totalWeight = equipped.reduce((sum, item) => sum + (item?.weight || 0), 0);
  const estimatedDamage = equipped
    .map((item) => item?.damage)
    .filter(Boolean)
    .reduce((sum, damage) => sum + Math.round(((damage?.min || 0) + (damage?.max || 0)) / 2), 0);

  return (
    <DevModeLayout
      title="Character Preview"
      description="Read-only snapshot of the character profile saved from editor mode."
    >
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setVersion((prev) => prev + 1)}
          className="rounded bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-400"
        >
          Reload From Editor
        </button>
        <p className="text-sm text-zinc-400">Items in catalog: {ITEM_CATALOG.length}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Archetype</p>
          <h2 className="text-3xl font-bold text-zinc-100">{character.name}</h2>
          <p className="text-sm text-zinc-400">{character.archetype}</p>

          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded border border-zinc-700 bg-zinc-950 p-2">
              <p className="text-zinc-500">Level</p>
              <p className="text-lg font-semibold text-zinc-100">{character.level}</p>
            </div>
            <div className="rounded border border-zinc-700 bg-zinc-950 p-2">
              <p className="text-zinc-500">EXP</p>
              <p className="text-lg font-semibold text-zinc-100">{character.exp}</p>
            </div>
            <div className="rounded border border-zinc-700 bg-zinc-950 p-2">
              <p className="text-zinc-500">Next EXP</p>
              <p className="text-lg font-semibold text-zinc-100">{character.nextLevelExp}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
            <div className="rounded border border-zinc-700 bg-zinc-950 p-2">
              <p className="text-zinc-500">HP</p>
              <p className="font-semibold text-zinc-100">{character.hp}</p>
            </div>
            <div className="rounded border border-zinc-700 bg-zinc-950 p-2">
              <p className="text-zinc-500">AP</p>
              <p className="font-semibold text-zinc-100">{character.ap}</p>
            </div>
            <div className="rounded border border-zinc-700 bg-zinc-950 p-2">
              <p className="text-zinc-500">AC</p>
              <p className="font-semibold text-zinc-100">{character.ac}</p>
            </div>
            <div className="rounded border border-zinc-700 bg-zinc-950 p-2">
              <p className="text-zinc-500">Skill Pts</p>
              <p className="font-semibold text-zinc-100">{character.skillPoints}</p>
            </div>
          </div>

          {character.notes ? (
            <div className="mt-4 rounded border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300">{character.notes}</div>
          ) : null}
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-semibold text-zinc-100">Loadout Summary</h2>
          <p className="text-sm text-zinc-400">Total weight: {totalWeight.toFixed(1)} | Estimated avg damage: {estimatedDamage}</p>

          <div className="mt-4 space-y-2">
            {equipped.length === 0 ? (
              <p className="text-sm text-zinc-500">No items selected in editor mode.</p>
            ) : (
              equipped.map((item) => (
                <article key={item?.id} className="rounded border border-zinc-700 bg-zinc-950 p-3">
                  <p className="text-sm font-semibold text-zinc-100">{item?.name}</p>
                  <p className="text-xs text-zinc-400">{item?.description}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </DevModeLayout>
  );
}

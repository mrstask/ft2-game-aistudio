import { useMemo, useState } from 'react';
import { DevModeLayout } from './DevModeLayout';
import { CHARACTER_STORAGE_KEY, DEFAULT_CHARACTER_DATA, ITEM_CATALOG, type CharacterEditorData } from './data';

function loadCharacterData(): CharacterEditorData {
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

export function CharacterEditorPage() {
  const initial = useMemo(() => loadCharacterData(), []);
  const [character, setCharacter] = useState<CharacterEditorData>(initial);

  const setNumber = (field: keyof CharacterEditorData, value: number) => {
    setCharacter((prev) => ({ ...prev, [field]: Number.isFinite(value) ? value : 0 }));
  };

  const save = () => {
    localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(character));
  };

  const toggleItem = (itemId: string) => {
    setCharacter((prev) => {
      const hasItem = prev.itemIds.includes(itemId);
      return {
        ...prev,
        itemIds: hasItem ? prev.itemIds.filter((id) => id !== itemId) : [...prev.itemIds, itemId],
      };
    });
  };

  return (
    <DevModeLayout
      title="Character Editor Mode"
      description="Edit player stats and loadout separately, then verify in the preview page."
    >
      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <label className="block text-sm text-zinc-300">
            Name
            <input
              type="text"
              value={character.name}
              onChange={(e) => setCharacter((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1"
            />
          </label>

          <label className="block text-sm text-zinc-300">
            Archetype
            <input
              type="text"
              value={character.archetype}
              onChange={(e) => setCharacter((prev) => ({ ...prev, archetype: e.target.value }))}
              className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1"
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            <label className="text-sm text-zinc-300">
              Level
              <input type="number" value={character.level} onChange={(e) => setNumber('level', Number(e.target.value))} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1" />
            </label>
            <label className="text-sm text-zinc-300">
              EXP
              <input type="number" value={character.exp} onChange={(e) => setNumber('exp', Number(e.target.value))} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1" />
            </label>
            <label className="text-sm text-zinc-300">
              Next EXP
              <input type="number" value={character.nextLevelExp} onChange={(e) => setNumber('nextLevelExp', Number(e.target.value))} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1" />
            </label>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <label className="text-sm text-zinc-300">
              HP
              <input type="number" value={character.hp} onChange={(e) => setNumber('hp', Number(e.target.value))} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1" />
            </label>
            <label className="text-sm text-zinc-300">
              AP
              <input type="number" value={character.ap} onChange={(e) => setNumber('ap', Number(e.target.value))} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1" />
            </label>
            <label className="text-sm text-zinc-300">
              AC
              <input type="number" value={character.ac} onChange={(e) => setNumber('ac', Number(e.target.value))} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1" />
            </label>
            <label className="text-sm text-zinc-300">
              Skill Pts
              <input type="number" value={character.skillPoints} onChange={(e) => setNumber('skillPoints', Number(e.target.value))} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1" />
            </label>
          </div>

          <label className="block text-sm text-zinc-300">
            Notes
            <textarea
              value={character.notes}
              onChange={(e) => setCharacter((prev) => ({ ...prev, notes: e.target.value }))}
              rows={4}
              className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1"
            />
          </label>

          <button type="button" onClick={save} className="w-full rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-500">
            Save Character
          </button>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 text-lg font-semibold text-zinc-100">Loadout Items</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {ITEM_CATALOG.map((item) => {
              const selected = character.itemIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`rounded border p-3 text-left ${selected ? 'border-amber-300 bg-amber-300/10 text-amber-100' : 'border-zinc-700 bg-zinc-950 text-zinc-300'}`}
                >
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-zinc-400">{item.category} | wt {item.weight} | value {item.value}</p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </DevModeLayout>
  );
}

import { DevModeLayout } from './DevModeLayout';
import { ENEMY_CATALOG, ITEM_CATALOG, TILE_SUMMARY, levelMilestones } from './data';

export function SystemsReferencePage() {
  const milestones = levelMilestones(8);

  return (
    <DevModeLayout
      title="Systems Reference"
      description="Single reference page for level rules, experience progression, item economy, and enemy catalogs."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="text-lg font-semibold text-zinc-100">Level System</h2>
          <p className="mt-2 text-sm text-zinc-300">Base formula: next level EXP = 1000 + (current level - 1) x 600.</p>
          <p className="text-sm text-zinc-300">Award 3 skill points per level-up. Combat encounters use enemy EXP values from the enemy list.</p>
          <p className="mt-3 text-sm text-zinc-400">Tile definitions available for level building: {TILE_SUMMARY.total} across {TILE_SUMMARY.families.length} families.</p>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="text-lg font-semibold text-zinc-100">Experience System</h2>
          <div className="mt-3 overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-zinc-400">
                  <th className="pr-4">Target Level</th>
                  <th className="pr-4">Cumulative EXP</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((entry) => (
                  <tr key={entry.level} className="border-t border-zinc-800">
                    <td className="py-1 pr-4 text-zinc-200">{entry.level}</td>
                    <td className="py-1 pr-4 text-zinc-300">{entry.requiredExp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="text-lg font-semibold text-zinc-100">Items System</h2>
          <p className="mt-2 text-sm text-zinc-300">Categories: weapon, armor, chem, quest, misc. Weight and value drive inventory and economy balance.</p>
          <div className="mt-3 space-y-2">
            {ITEM_CATALOG.map((item) => (
              <article key={item.id} className="rounded border border-zinc-700 bg-zinc-950 p-2">
                <p className="text-sm font-semibold text-zinc-100">{item.name}</p>
                <p className="text-xs text-zinc-400">{item.category} | wt {item.weight} | value {item.value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="text-lg font-semibold text-zinc-100">Enemy List</h2>
          <div className="mt-3 overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-zinc-400">
                  <th className="pr-3">Enemy</th>
                  <th className="pr-3">HP</th>
                  <th className="pr-3">AP</th>
                  <th className="pr-3">AC</th>
                  <th className="pr-3">EXP</th>
                  <th className="pr-3">Threat</th>
                </tr>
              </thead>
              <tbody>
                {ENEMY_CATALOG.map((enemy) => (
                  <tr key={enemy.id} className="border-t border-zinc-800">
                    <td className="py-1 pr-3 text-zinc-200">{enemy.name}</td>
                    <td className="py-1 pr-3 text-zinc-300">{enemy.hp}</td>
                    <td className="py-1 pr-3 text-zinc-300">{enemy.ap}</td>
                    <td className="py-1 pr-3 text-zinc-300">{enemy.ac}</td>
                    <td className="py-1 pr-3 text-zinc-300">{enemy.expValue}</td>
                    <td className="py-1 pr-3 text-zinc-300">{enemy.threat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DevModeLayout>
  );
}

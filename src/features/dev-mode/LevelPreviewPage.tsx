import { useEffect, useMemo, useRef, useState } from 'react';
import { DevModeLayout } from './DevModeLayout';
import { DEFAULT_LEVEL_DATA, LEVEL_STORAGE_KEY, normalizeLevelData, type LevelEditorData } from './data';
import { drawLevelScene } from './levelScene';

function loadLevelData(): LevelEditorData {
  try {
    const raw = localStorage.getItem(LEVEL_STORAGE_KEY);
    if (!raw) return DEFAULT_LEVEL_DATA;
    return normalizeLevelData(JSON.parse(raw));
  } catch {
    return DEFAULT_LEVEL_DATA;
  }
}

export function LevelPreviewPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [version, setVersion] = useState(0);
  const [zoom, setZoom] = useState(1);
  const level = useMemo(() => loadLevelData(), [version]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawLevelScene(ctx, level, null, zoom);
  }, [level, zoom]);

  return (
    <DevModeLayout
      title="Level Preview"
      description="Read-only trimetric render of the saved level including tiles, walls, doors, and interiors."
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setVersion((prev) => prev + 1)} className="rounded bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-400">
          Reload From Editor
        </button>
        <p className="text-sm text-zinc-400">
          Grid: {level.width}x{level.height} | Walls: {Object.keys(level.walls).length} | Doors: {Object.keys(level.doors).length} | Interiors: {Object.keys(level.interiors).length}
        </p>
        <div className="ml-auto flex items-center gap-2 text-xs text-zinc-400">
          <button type="button" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))} className="rounded border border-zinc-700 px-2 py-1">-</button>
          <span>{zoom.toFixed(2)}x</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(2.2, +(z + 0.1).toFixed(2)))} className="rounded border border-zinc-700 px-2 py-1">+</button>
        </div>
      </div>

      <section className="overflow-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <canvas ref={canvasRef} width={1000} height={760} className="w-full h-auto rounded border border-zinc-800 bg-black" />
      </section>
    </DevModeLayout>
  );
}

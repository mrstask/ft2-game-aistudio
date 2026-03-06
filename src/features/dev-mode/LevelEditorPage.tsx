import { useEffect, useMemo, useRef, useState } from 'react';
import { FALLOUT2_TILE_TYPES, TILE_FAMILY_ORDER, getTileTypesByFamily, type TileFamily } from '../../game/tileCatalog';
import { FALLOUT2_WALL_TYPES, getWallTypesByFamily, type WallFamily } from '../../game/wallCatalog';
import { DevModeLayout } from './DevModeLayout';
import {
  CORNER_ORIENTATIONS,
  DEFAULT_LEVEL_DATA,
  DEFAULT_TILE_ID,
  getWallSpan,
  INTERIOR_CATALOG,
  LEVEL_STORAGE_KEY,
  MAX_LEVEL_SIZE,
  normalizeLevelData,
  occupiedWallCells,
  rotateInterior,
  WALL_ITEMS,
  WALL_SHAPES,
  type InteriorRotation,
  type LevelDoorPlacement,
  type LevelEditorData,
  type LevelInteriorPlacement,
  type LevelWallPlacement,
  type CornerOrientation,
  type WallEdge,
  type WallItem,
  type WallShape,
} from './data';
import { drawLevelScene, toSceneGrid } from './levelScene';

type EditLayer = 'tile' | 'wall' | 'door' | 'interior';
type BrushMode = 'paint' | 'erase';
const BUILDER_WALL_FAMILIES: WallFamily[] = ['ruins'];

function safeLoadLevelData(): LevelEditorData {
  try {
    const raw = localStorage.getItem(LEVEL_STORAGE_KEY);
    if (!raw) return DEFAULT_LEVEL_DATA;
    return normalizeLevelData(JSON.parse(raw));
  } catch {
    return DEFAULT_LEVEL_DATA;
  }
}

function wallPreviewTheme(wallId: string): { main: string; shade: string; line: string; moss?: string } {
  if (wallId.includes('cracked')) return { main: '#736154', shade: '#5b4b41', line: '#2c241f' };
  if (wallId.includes('moss')) return { main: '#706257', shade: '#594c42', line: '#28211d', moss: '#3f6c3f' };
  if (wallId.includes('engraved')) return { main: '#7b6959', shade: '#655445', line: '#312721' };
  if (wallId.includes('archway') || wallId.includes('doorway')) return { main: '#735f52', shade: '#5d4b40', line: '#2f251f' };
  return { main: '#76665a', shade: '#604f44', line: '#2d2420' };
}

function wallItemPreview(item: WallItem): string {
  if (item === 'ivy') return 'ivy';
  if (item === 'crack') return 'crack';
  if (item === 'torch') return 'torch';
  if (item === 'banner') return 'banner';
  return 'plain';
}

export function LevelEditorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggedWhilePanningRef = useRef(false);
  const [levelData, setLevelData] = useState<LevelEditorData>(() => safeLoadLevelData());
  const [zoom, setZoom] = useState(1);
  const [hovered, setHovered] = useState<{ x: number; y: number } | null>(null);
  const [viewOffset, setViewOffset] = useState({ x: 500, y: 92 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });

  const [layer, setLayer] = useState<EditLayer>('tile');
  const [brushMode, setBrushMode] = useState<BrushMode>('paint');

  const [tileFamily, setTileFamily] = useState<TileFamily>('dirt');
  const [selectedTileId, setSelectedTileId] = useState(DEFAULT_TILE_ID);

  const [wallFamily, setWallFamily] = useState<WallFamily>('ruins');
  const [selectedWallId, setSelectedWallId] = useState('ruins-stone-plain');
  const [wallEdge, setWallEdge] = useState<WallEdge>('right');
  const [wallShape, setWallShape] = useState<WallShape>('straight');
  const [cornerOrientation, setCornerOrientation] = useState<CornerOrientation>('north');
  const [wallItem, setWallItem] = useState<WallItem>('none');

  const [doorEdge, setDoorEdge] = useState<WallEdge>('right');
  const [doorOpen, setDoorOpen] = useState(false);
  const [doorLocked, setDoorLocked] = useState(true);

  const [selectedInteriorId, setSelectedInteriorId] = useState(INTERIOR_CATALOG[0].id);
  const [interiorRotation, setInteriorRotation] = useState<InteriorRotation>(0);

  const tilePalette = useMemo(() => getTileTypesByFamily(tileFamily), [tileFamily]);
  const wallPalette = useMemo(() => getWallTypesByFamily(wallFamily), [wallFamily]);
  const selectedWallSpan = getWallSpan(selectedWallId);
  const selectedWallIsArchway = selectedWallId.includes('archway');
  const selectedWallForcesStraight = selectedWallSpan > 1 || selectedWallIsArchway;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawLevelScene(
      ctx,
      levelData,
      hovered,
      zoom,
      brushMode === 'paint' && hovered
        ? layer === 'wall'
          ? {
            layer: 'wall',
            x: hovered.x,
            y: hovered.y,
            wallPlacement: {
              wallId: selectedWallId,
              edge: wallEdge,
              shape: selectedWallForcesStraight ? 'straight' : wallShape,
              cornerOrientation,
              item: selectedWallForcesStraight ? 'none' : wallItem,
              span: getWallSpan(selectedWallId),
            },
          }
          : layer === 'door'
            ? { layer: 'door', x: hovered.x, y: hovered.y, edge: doorEdge, doorOpen, doorLocked }
            : layer === 'interior'
              ? { layer: 'interior', x: hovered.x, y: hovered.y, interior: { interiorId: selectedInteriorId, rotation: interiorRotation } }
              : undefined
        : undefined,
      viewOffset,
    );
  }, [brushMode, cornerOrientation, doorEdge, doorLocked, doorOpen, hovered, interiorRotation, layer, levelData, selectedInteriorId, selectedWallId, viewOffset, wallEdge, wallItem, wallShape, zoom]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const step = 20;
      if (event.key === 'ArrowUp') setViewOffset((prev) => ({ ...prev, y: prev.y + step }));
      if (event.key === 'ArrowDown') setViewOffset((prev) => ({ ...prev, y: prev.y - step }));
      if (event.key === 'ArrowLeft') setViewOffset((prev) => ({ ...prev, x: prev.x + step }));
      if (event.key === 'ArrowRight') setViewOffset((prev) => ({ ...prev, x: prev.x - step }));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'r') return;
      if (layer === 'wall') {
        if (wallShape === 'corner' && !selectedWallForcesStraight) {
          setCornerOrientation((prev) => {
            if (prev === 'north') return 'east';
            if (prev === 'east') return 'south';
            if (prev === 'south') return 'west';
            return 'north';
          });
        } else {
          setWallEdge((prev) => (prev === 'left' ? 'right' : 'left'));
        }
      }
      if (layer === 'interior') {
        setInteriorRotation((prev) => rotateInterior(prev));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [layer, selectedWallForcesStraight, wallShape]);

  const setSize = (field: 'width' | 'height', value: number) => {
    const next = Math.max(6, Math.min(MAX_LEVEL_SIZE, Math.round(value || 6)));
    setLevelData((prev) => ({ ...prev, [field]: next }));
  };

  const save = () => {
    localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(levelData));
  };

  const paintAt = (x: number, y: number) => {
    const key = `${x},${y}`;
    setLevelData((prev) => {
      const next: LevelEditorData = {
        ...prev,
        tiles: { ...prev.tiles },
        walls: { ...prev.walls },
        doors: { ...prev.doors },
        interiors: { ...prev.interiors },
      };

      if (brushMode === 'erase') {
        if (layer === 'tile') delete next.tiles[key];
        if (layer === 'wall') {
          const occupancy = new Map<string, string>();
          (Object.entries(prev.walls) as Array<[string, LevelWallPlacement]>).forEach(([anchorKey, placement]) => {
            const [ax, ay] = anchorKey.split(',').map(Number);
            occupiedWallCells(ax, ay, placement).forEach((cell) => occupancy.set(`${cell.x},${cell.y}`, anchorKey));
          });
          const anchorKey = occupancy.get(key) || key;
          delete next.walls[anchorKey];
        }
        if (layer === 'door') delete next.doors[key];
        if (layer === 'interior') delete next.interiors[key];
        return next;
      }

      if (layer === 'tile') next.tiles[key] = selectedTileId;
      if (layer === 'wall') {
        const span = getWallSpan(selectedWallId);
        const placement = {
          wallId: selectedWallId,
          edge: wallEdge,
          shape: (span > 1 || selectedWallIsArchway) ? 'straight' : wallShape,
          cornerOrientation,
          item: (span > 1 || selectedWallIsArchway) ? 'none' : wallItem,
          span,
        } as const;
        const occupied = occupiedWallCells(x, y, placement);
        const withinBounds = occupied.every((cell) => cell.x >= 0 && cell.y >= 0 && cell.x < prev.width && cell.y < prev.height);
        if (!withinBounds) return prev;

        const occupancy = new Map<string, string>();
        (Object.entries(prev.walls) as Array<[string, LevelWallPlacement]>).forEach(([anchorKey, wall]) => {
          const [ax, ay] = anchorKey.split(',').map(Number);
          occupiedWallCells(ax, ay, wall).forEach((cell) => occupancy.set(`${cell.x},${cell.y}`, anchorKey));
        });
        const conflictingAnchors = new Set<string>();
        occupied.forEach((cell) => {
          const existingAnchor = occupancy.get(`${cell.x},${cell.y}`);
          if (existingAnchor) conflictingAnchors.add(existingAnchor);
        });
        conflictingAnchors.forEach((anchorKey) => delete next.walls[anchorKey]);
        next.walls[key] = placement;
      }
      if (layer === 'door') {
        const door: LevelDoorPlacement = { edge: doorEdge, isOpen: doorOpen, isLocked: doorLocked };
        next.doors[key] = door;
      }
      if (layer === 'interior') {
        const interior: LevelInteriorPlacement = { interiorId: selectedInteriorId, rotation: interiorRotation };
        next.interiors[key] = interior;
      }
      return next;
    });
  };

  const clearActiveLayer = () => {
    setLevelData((prev) => {
      if (layer === 'tile') return { ...prev, tiles: {} };
      if (layer === 'wall') return { ...prev, walls: {} };
      if (layer === 'door') return { ...prev, doors: {} };
      return { ...prev, interiors: {} };
    });
  };

  return (
    <DevModeLayout
      title="Level Building Mode"
      description="Trimetric editor for Fallout-style map blocking. Set tiles, walls, doors, and interior props with rotation."
    >
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <aside className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-zinc-300">
              Width
              <input type="number" min={6} max={MAX_LEVEL_SIZE} value={levelData.width} onChange={(e) => setSize('width', Number(e.target.value))} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1" />
            </label>
            <label className="text-sm text-zinc-300">
              Height
              <input type="number" min={6} max={MAX_LEVEL_SIZE} value={levelData.height} onChange={(e) => setSize('height', Number(e.target.value))} className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1" />
            </label>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-zinc-400">Layer</p>
            <div className="grid grid-cols-4 gap-2">
              {(['tile', 'wall', 'door', 'interior'] as EditLayer[]).map((entry) => (
                <button key={entry} type="button" onClick={() => setLayer(entry)} className={`rounded border px-2 py-1 text-xs uppercase ${entry === layer ? 'border-amber-300 text-amber-200' : 'border-zinc-700 text-zinc-300'}`}>
                  {entry}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-zinc-400">Brush</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setBrushMode('paint')} className={`rounded border px-2 py-1 text-xs uppercase ${brushMode === 'paint' ? 'border-emerald-300 text-emerald-200' : 'border-zinc-700 text-zinc-300'}`}>Paint</button>
              <button type="button" onClick={() => setBrushMode('erase')} className={`rounded border px-2 py-1 text-xs uppercase ${brushMode === 'erase' ? 'border-red-300 text-red-200' : 'border-zinc-700 text-zinc-300'}`}>Erase</button>
            </div>
          </div>

          {layer === 'tile' && (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-zinc-400">Tiles</p>
              <div className="flex flex-wrap gap-2">
                {TILE_FAMILY_ORDER.map((entry) => (
                  <button key={entry} type="button" onClick={() => setTileFamily(entry)} className={`rounded border px-2 py-1 text-xs uppercase ${entry === tileFamily ? 'border-amber-300 text-amber-200' : 'border-zinc-700 text-zinc-300'}`}>{entry}</button>
                ))}
              </div>
              <div className="max-h-40 space-y-2 overflow-auto pr-1">
                {tilePalette.map((tile) => (
                  <button key={tile.id} type="button" onClick={() => setSelectedTileId(tile.id)} className={`w-full rounded border px-2 py-1 text-left text-sm ${tile.id === selectedTileId ? 'border-amber-300 bg-amber-300/10 text-amber-100' : 'border-zinc-700 text-zinc-300'}`}>
                    {tile.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {layer === 'wall' && (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-zinc-400">Walls</p>
              <div className="flex flex-wrap gap-2">
                {BUILDER_WALL_FAMILIES.map((entry) => (
                  <button key={entry} type="button" onClick={() => setWallFamily(entry)} className={`rounded border px-2 py-1 text-xs uppercase ${entry === wallFamily ? 'border-emerald-300 text-emerald-200' : 'border-zinc-700 text-zinc-300'}`}>{entry}</button>
                ))}
              </div>
              <div className="max-h-40 space-y-2 overflow-auto pr-1">
                {wallPalette.map((wall) => (
                  <button
                    key={wall.id}
                    type="button"
                    onClick={() => setSelectedWallId(wall.id)}
                    className={`w-full rounded border p-2 text-left ${wall.id === selectedWallId ? 'border-emerald-300 bg-emerald-300/10 text-emerald-100' : 'border-zinc-700 text-zinc-300'}`}
                  >
                    {(() => {
                      const c = wallPreviewTheme(wall.id);
                      return (
                        <div className="flex items-center gap-2">
                          <div className="relative h-9 w-16 overflow-hidden rounded border border-black/40 bg-zinc-950">
                            <div className="absolute left-1 top-1 h-6 w-6 -skew-y-[24deg] skew-x-[8deg] rounded-sm border" style={{ backgroundColor: c.main, borderColor: c.line }} />
                            <div className="absolute left-5 top-2 h-6 w-9 -skew-y-[24deg] rounded-sm border" style={{ backgroundColor: c.shade, borderColor: c.line }} />
                            {c.moss ? <div className="absolute left-8 top-3 h-2 w-3 rounded-sm opacity-80" style={{ backgroundColor: c.moss }} /> : null}
                            {wall.id.includes('cracked') ? (
                              <>
                                <div className="absolute left-8 top-2 h-5 w-px rotate-[20deg] bg-black/75" />
                                <div className="absolute left-10 top-4 h-4 w-px -rotate-[14deg] bg-black/70" />
                                <div className="absolute left-11 top-5 h-2 w-px rotate-[35deg] bg-black/65" />
                              </>
                            ) : null}
                            {wall.id.includes('engraved') ? <div className="absolute left-9 top-4 h-2 w-2 rounded-full border border-black/60" /> : null}
                            {wall.id.includes('archway-wide') ? (
                              <>
                                <div className="absolute left-6 top-3 h-4 w-3 rounded-b-sm bg-black/65" />
                                <div className="absolute left-6 top-2 h-2 w-3 rounded-t-full border-t border-black/70" />
                                <div className="absolute left-11 top-2 h-5 w-3 rounded-sm border border-black/35 bg-zinc-800/30" />
                              </>
                            ) : wall.id.includes('archway') || wall.id.includes('doorway') ? (
                              <>
                                <div className="absolute left-8 top-3 h-4 w-3 rounded-b-sm bg-black/65" />
                                <div className="absolute left-8 top-2 h-2 w-3 rounded-t-full border-t border-black/70" />
                              </>
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold">{wall.label}</p>
                            <p className="truncate text-[10px] text-zinc-400">{wall.id} {getWallSpan(wall.id) > 1 ? `| ${getWallSpan(wall.id)} cells` : ''}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setWallEdge('left')} className={`rounded border px-2 py-1 text-xs uppercase ${wallEdge === 'left' ? 'border-amber-300 text-amber-200' : 'border-zinc-700 text-zinc-300'}`}>\ Edge</button>
                <button type="button" onClick={() => setWallEdge('right')} className={`rounded border px-2 py-1 text-xs uppercase ${wallEdge === 'right' ? 'border-amber-300 text-amber-200' : 'border-zinc-700 text-zinc-300'}`}>/ Edge</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {WALL_SHAPES.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => {
                      if (selectedWallForcesStraight) return;
                      setWallShape(entry.id);
                    }}
                    className={`rounded border px-2 py-1 text-xs uppercase ${selectedWallForcesStraight ? 'border-zinc-800 text-zinc-600 cursor-not-allowed' : wallShape === entry.id ? 'border-emerald-300 text-emerald-200' : 'border-zinc-700 text-zinc-300'}`}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
              {!selectedWallForcesStraight && wallShape === 'corner' ? (
                <div className="grid grid-cols-4 gap-2">
                  {CORNER_ORIENTATIONS.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setCornerOrientation(entry.id)}
                      className={`rounded border px-2 py-1 text-xs uppercase ${cornerOrientation === entry.id ? 'border-amber-300 text-amber-200' : 'border-zinc-700 text-zinc-300'}`}
                    >
                      {entry.label}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                {WALL_ITEMS.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => {
                      if (selectedWallForcesStraight) return;
                      setWallItem(entry.id);
                    }}
                    className={`rounded border px-2 py-2 text-xs uppercase ${selectedWallForcesStraight ? 'border-zinc-800 text-zinc-600 cursor-not-allowed' : wallItem === entry.id ? 'border-sky-300 text-sky-200 bg-sky-300/10' : 'border-zinc-700 text-zinc-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative h-6 w-6 rounded border border-black/40 bg-zinc-900">
                        {wallItemPreview(entry.id) === 'ivy' ? <div className="absolute inset-1 rounded bg-green-700/70" /> : null}
                        {wallItemPreview(entry.id) === 'crack' ? <div className="absolute left-3 top-1 h-4 w-px rotate-12 bg-zinc-100/80" /> : null}
                        {wallItemPreview(entry.id) === 'torch' ? <><div className="absolute left-3 top-2 h-3 w-px bg-amber-200" /><div className="absolute left-2 top-1 h-2 w-2 rotate-45 bg-amber-500/80" /></> : null}
                        {wallItemPreview(entry.id) === 'banner' ? <><div className="absolute left-3 top-1 h-4 w-px bg-zinc-200" /><div className="absolute left-4 top-2 h-2 w-2 bg-red-800/80" /></> : null}
                      </div>
                      <span>{entry.label}</span>
                    </div>
                  </button>
                ))}
              </div>
              {selectedWallForcesStraight ? <p className="text-xs text-zinc-500">Archway walls always paint as straight with no wall item.</p> : null}
              <p className="text-xs text-zinc-500">Press `R` to rotate {wallShape === 'corner' && !selectedWallForcesStraight ? 'corner orientation' : 'wall edge'}.</p>
            </div>
          )}

          {layer === 'door' && (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-zinc-400">Doors</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDoorEdge('left')} className={`rounded border px-2 py-1 text-xs uppercase ${doorEdge === 'left' ? 'border-amber-300 text-amber-200' : 'border-zinc-700 text-zinc-300'}`}>\ Edge</button>
                <button type="button" onClick={() => setDoorEdge('right')} className={`rounded border px-2 py-1 text-xs uppercase ${doorEdge === 'right' ? 'border-amber-300 text-amber-200' : 'border-zinc-700 text-zinc-300'}`}>/ Edge</button>
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={doorOpen} onChange={(e) => setDoorOpen(e.target.checked)} /> Open door
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={doorLocked} onChange={(e) => setDoorLocked(e.target.checked)} /> Locked
              </label>
            </div>
          )}

          {layer === 'interior' && (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-zinc-400">Interiors</p>
              <div className="max-h-40 space-y-2 overflow-auto pr-1">
                {INTERIOR_CATALOG.map((item) => (
                  <button key={item.id} type="button" onClick={() => setSelectedInteriorId(item.id)} className={`w-full rounded border px-2 py-1 text-left text-sm ${item.id === selectedInteriorId ? 'border-sky-300 bg-sky-300/10 text-sky-100' : 'border-zinc-700 text-zinc-300'}`}>
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setInteriorRotation((prev) => rotateInterior(prev))} className="rounded border border-sky-300/50 px-2 py-1 text-xs uppercase text-sky-200">Rotate</button>
                <span className="text-xs text-zinc-400">Rotation: {interiorRotation}deg</span>
              </div>
              <p className="text-xs text-zinc-500">Press `R` to rotate interior item.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={save} className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-50 hover:bg-emerald-500">Save Layout</button>
            <button type="button" onClick={clearActiveLayer} className="rounded bg-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-600">Clear Layer</button>
          </div>

          <p className="text-xs text-zinc-500">Tiles: {FALLOUT2_TILE_TYPES.length} | Walls: {FALLOUT2_WALL_TYPES.length} | Interiors: {INTERIOR_CATALOG.length}</p>
        </aside>

        <section className="overflow-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
            <span>Trimetric canvas editor (Fallout-style)</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))} className="rounded border border-zinc-700 px-2 py-1">-</button>
              <span>{zoom.toFixed(2)}x</span>
              <button type="button" onClick={() => setZoom((z) => Math.min(2.2, +(z + 0.1).toFixed(2)))} className="rounded border border-zinc-700 px-2 py-1">+</button>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            width={1000}
            height={760}
            className={`w-full h-auto rounded border border-zinc-800 bg-black ${isPanning ? 'cursor-grabbing' : 'cursor-crosshair'}`}
            onMouseDown={(e) => {
              if (e.button === 1 || (e.button === 0 && e.altKey)) {
                e.preventDefault();
                setIsPanning(true);
                setLastPanPos({ x: e.clientX, y: e.clientY });
                draggedWhilePanningRef.current = false;
              }
            }}
            onMouseMove={(e) => {
              if (isPanning) {
                const dx = e.clientX - lastPanPos.x;
                const dy = e.clientY - lastPanPos.y;
                if (dx !== 0 || dy !== 0) draggedWhilePanningRef.current = true;
                setViewOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
                setLastPanPos({ x: e.clientX, y: e.clientY });
                setHovered(null);
                return;
              }
              const canvas = canvasRef.current;
              if (!canvas) return;
              const point = toSceneGrid(canvas, e.clientX, e.clientY, zoom, levelData.width, levelData.height, viewOffset);
              setHovered(point);
            }}
            onMouseUp={() => setIsPanning(false)}
            onMouseLeave={() => {
              setHovered(null);
              setIsPanning(false);
            }}
            onClick={(e) => {
              if (e.altKey || draggedWhilePanningRef.current) {
                draggedWhilePanningRef.current = false;
                return;
              }
              const canvas = canvasRef.current;
              if (!canvas) return;
              const point = toSceneGrid(canvas, e.clientX, e.clientY, zoom, levelData.width, levelData.height, viewOffset);
              if (!point) return;
              paintAt(point.x, point.y);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (isPanning) return;
              const canvas = canvasRef.current;
              if (!canvas) return;
              const point = toSceneGrid(canvas, e.clientX, e.clientY, zoom, levelData.width, levelData.height, viewOffset);
              if (!point) return;
              const key = `${point.x},${point.y}`;
              setLevelData((prev) => {
                const next = { ...prev, tiles: { ...prev.tiles }, walls: { ...prev.walls }, doors: { ...prev.doors }, interiors: { ...prev.interiors } };
                if (layer === 'tile') delete next.tiles[key];
                if (layer === 'wall') {
                  const occupancy = new Map<string, string>();
                  (Object.entries(prev.walls) as Array<[string, LevelWallPlacement]>).forEach(([anchorKey, placement]) => {
                    const [ax, ay] = anchorKey.split(',').map(Number);
                    occupiedWallCells(ax, ay, placement).forEach((cell) => occupancy.set(`${cell.x},${cell.y}`, anchorKey));
                  });
                  delete next.walls[occupancy.get(key) || key];
                }
                if (layer === 'door') delete next.doors[key];
                if (layer === 'interior') delete next.interiors[key];
                return next;
              });
            }}
          />
        </section>
      </div>
    </DevModeLayout>
  );
}

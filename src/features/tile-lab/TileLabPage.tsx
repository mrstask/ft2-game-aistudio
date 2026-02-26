import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gridToScreen, screenToGrid } from '../../game/engine';
import { TILE_HEIGHT, TILE_WIDTH } from '../../game/constants';
import { FALLOUT2_TILE_TYPES, TILE_FAMILY_ORDER, getTileTypesByFamily, type TileFamily } from '../../game/tileCatalog';

const GRID_SIZE = 20;
const TILE_LAB_CAMERA = {
  // Fallout-style pseudo-3D fixed camera approximation (same baseline as preview page).
  scaleY: 0.901,
  skewX: -0.18,
  skewY: 0.02,
};

function tileColors(tileId: string): { base: string; accent: string; line: string } {
  if (tileId.startsWith('dirt')) return { base: '#8a735d', accent: '#9e8a72', line: '#5a4b3f' };
  if (tileId.startsWith('metal')) return { base: '#5b6168', accent: '#7a828a', line: '#323841' };
  if (tileId.startsWith('stone')) return { base: '#606367', accent: '#7a7f85', line: '#3f4349' };
  if (tileId.startsWith('cement')) return { base: '#4b4f53', accent: '#686d72', line: '#2e3236' };
  if (tileId.startsWith('wood')) return { base: '#6a513f', accent: '#8b6a52', line: '#412e23' };
  if (tileId.startsWith('grate')) return { base: '#454b51', accent: '#6e767e', line: '#23282d' };
  if (tileId.startsWith('roof')) return { base: '#726a63', accent: '#978b81', line: '#443f3b' };
  if (tileId.startsWith('road')) return { base: '#373c42', accent: '#525861', line: '#23272d' };
  if (tileId.startsWith('cave')) return { base: '#5f584d', accent: '#7a7266', line: '#3d382f' };
  return { base: '#4f555c', accent: '#6a727b', line: '#2b3036' };
}

function drawPattern(ctx: CanvasRenderingContext2D, tileId: string, x: number, y: number) {
  const c = tileColors(tileId);
  const family = tileId.split('-')[0];

  // Fine grain / noise pass (breaks flatness and avoids repeated center lines).
  ctx.fillStyle = c.line;
  for (let i = 0; i < 14; i++) {
    const px = x - 12 + ((i * 17) % 24);
    const py = y - 7 + ((i * 11) % 14);
    const w = (i % 3 === 0) ? 2 : 1;
    ctx.globalAlpha = 0.14;
    ctx.fillRect(px, py, w, 1);
  }
  ctx.globalAlpha = 1;

  if (family === 'dirt' || family === 'cave') {
    ctx.fillStyle = '#3c342c';
    for (let i = 0; i < 16; i++) {
      ctx.globalAlpha = 0.25;
      ctx.fillRect(x - 12 + ((i * 13) % 22), y - 6 + ((i * 7) % 12), 1, 1);
    }
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = c.accent;
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(x - 10 + ((i * 9) % 20), y - 5 + ((i * 5) % 10), 2, 1);
    }
    ctx.globalAlpha = 1;
  }

  if (family === 'metal' || family === 'industrial') {
    ctx.strokeStyle = '#242a31';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 4);
    ctx.lineTo(x - 2, y + 1);
    ctx.moveTo(x + 2, y - 5);
    ctx.lineTo(x + 12, y);
    ctx.stroke();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#9aa3ad';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 4);
    ctx.lineTo(x + 8, y - 1);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Rivets/bolts
    ctx.fillStyle = '#adb6bf';
    [[-8, -2], [-2, 1], [5, -1], [9, 3]].forEach(([dx, dy]) => {
      ctx.fillRect(x + dx, y + dy, 1, 1);
    });
  }

  if (family === 'stone' || family === 'cement' || family === 'road') {
    ctx.strokeStyle = '#2b2f34';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(x - 11, y - 1);
    ctx.lineTo(x - 3, y - 3);
    ctx.lineTo(x + 3, y);
    ctx.lineTo(x + 10, y - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 7, y + 5);
    ctx.lineTo(x - 1, y + 2);
    ctx.lineTo(x + 6, y + 4);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (family === 'wood' || family === 'roof') {
    ctx.strokeStyle = '#4d3a2f';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;
    for (let i = -10; i <= 10; i += 4) {
      ctx.beginPath();
      ctx.moveTo(x + i, y - 6);
      ctx.lineTo(x + i + 4, y + 6);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#b08b6c';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 2);
    ctx.lineTo(x + 10, y - 3);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (tileId.includes('stripe')) {
    ctx.strokeStyle = '#c24b3b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 2);
    ctx.lineTo(x + 6, y + 2);
    ctx.moveTo(x - 6, y + 2);
    ctx.lineTo(x + 6, y + 6);
    ctx.stroke();
  }

  if (tileId.includes('grate') || tileId.includes('grid')) {
    ctx.strokeStyle = c.accent;
    ctx.globalAlpha = 0.5;
    for (let i = -8; i <= 8; i += 4) {
      ctx.beginPath();
      ctx.moveTo(x + i, y - 4);
      ctx.lineTo(x + i, y + 4);
      ctx.stroke();
    }
    for (let i = -4; i <= 4; i += 4) {
      ctx.beginPath();
      ctx.moveTo(x - 10, y + i);
      ctx.lineTo(x + 10, y + i);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  if (tileId.includes('crack') || tileId.includes('cracked')) {
    ctx.strokeStyle = '#1f2226';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 3);
    ctx.lineTo(x - 2, y);
    ctx.lineTo(x + 3, y - 2);
    ctx.lineTo(x + 8, y + 3);
    ctx.lineTo(x + 2, y + 1);
    ctx.lineTo(x - 1, y + 4);
    ctx.stroke();
  }

  if (tileId.includes('debris') || tileId.includes('rocky') || tileId.includes('pebble')) {
    ctx.fillStyle = c.line;
    for (let i = 0; i < 8; i++) {
      ctx.globalAlpha = 0.35;
      ctx.fillRect(x - 9 + ((i * 7) % 18), y - 5 + ((i * 5) % 10), (i % 3) ? 1 : 2, 1);
    }
    ctx.globalAlpha = 1;
  }
}

function paintTile(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, tileId: string, selected: boolean) {
  const c = tileColors(tileId);
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT);
  ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fillStyle = c.base;
  ctx.fill();
  ctx.strokeStyle = selected ? '#f2f2f2' : c.line;
  ctx.lineWidth = selected ? 2 : 1;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT);
  ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.clip();

  // Multi-pass lighting to avoid flat fills.
  const gradA = ctx.createLinearGradient(screenX - 22, screenY + 4, screenX + 22, screenY + TILE_HEIGHT - 2);
  gradA.addColorStop(0, c.accent);
  gradA.addColorStop(1, c.base);
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = gradA;
  ctx.fillRect(screenX - TILE_WIDTH / 2, screenY, TILE_WIDTH, TILE_HEIGHT);
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(screenX - 10, screenY + 2, 16, 4);
  ctx.globalAlpha = 1;
  drawPattern(ctx, tileId, screenX, screenY + TILE_HEIGHT / 2);
  ctx.restore();
}

export function TileLabPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedFamily, setSelectedFamily] = useState<TileFamily>('dirt');
  const [selectedTileId, setSelectedTileId] = useState(FALLOUT2_TILE_TYPES[0].id);
  const [zoom, setZoom] = useState(1);
  const [hovered, setHovered] = useState<{ x: number; y: number } | null>(null);
  const [mapTiles, setMapTiles] = useState<Record<string, string>>({});

  const familyTiles = useMemo(() => getTileTypesByFamily(selectedFamily), [selectedFamily]);

  useEffect(() => {
    if (!familyTiles.some((t) => t.id === selectedTileId)) {
      setSelectedTileId(familyTiles[0]?.id || selectedTileId);
    }
  }, [familyTiles, selectedTileId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#090b0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, 70);
    ctx.scale(zoom, zoom);
    ctx.transform(1, TILE_LAB_CAMERA.skewY, TILE_LAB_CAMERA.skewX, TILE_LAB_CAMERA.scaleY, 0, 0);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const screen = gridToScreen(x, y);
        const key = `${x},${y}`;
        const tileId = mapTiles[key] || 'dirt-plain';
        const isHovered = hovered?.x === x && hovered?.y === y;
        paintTile(ctx, screen.x, screen.y, tileId, isHovered);
      }
    }

    ctx.restore();
  }, [hovered, mapTiles, zoom]);

  const toGrid = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const localX = (clientX - rect.left - canvas.width / 2) / zoom;
    const localY = (clientY - rect.top - 70) / zoom;
    // Invert the pseudo-3D camera projection matrix before converting screen -> grid.
    const a = 1;
    const b = TILE_LAB_CAMERA.skewY;
    const c = TILE_LAB_CAMERA.skewX;
    const d = TILE_LAB_CAMERA.scaleY;
    const det = a * d - b * c;
    const projX = (d * localX - c * localY) / det;
    const projY = (-b * localX + a * localY) / det;
    const grid = screenToGrid(projX, projY);
    if (grid.x < 0 || grid.y < 0 || grid.x >= GRID_SIZE || grid.y >= GRID_SIZE) return null;
    return { x: grid.x, y: grid.y };
  };

  const paintAt = (grid: { x: number; y: number } | null) => {
    if (!grid) return;
    setMapTiles((prev) => ({ ...prev, [`${grid.x},${grid.y}`]: selectedTileId }));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,#211615_0%,#090b10_42%,#050608_100%)] text-white p-4">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-4 flex items-center justify-between gap-3 border border-white/10 bg-black/35 p-4">
          <div>
            <h1 className="font-mono text-xl uppercase tracking-wide text-amber-200">Tile Lab</h1>
            <p className="font-mono text-xs text-white/60">Paint Fallout-style tile families onto an empty isometric floor</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/wall-lab.html" className="font-mono text-xs uppercase border border-emerald-300/40 px-3 py-2 text-emerald-200 hover:bg-emerald-300/10">
              Wall Lab
            </a>
            <a href="/" className="font-mono text-xs uppercase border border-amber-300/40 px-3 py-2 text-amber-200 hover:bg-amber-300/10">
              Main App
            </a>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <div className="space-y-4 border border-white/10 bg-black/35 p-4">
            <div>
              <div className="mb-2 font-mono text-xs uppercase text-white/70">Tile Family</div>
              <div className="grid grid-cols-2 gap-2">
                {TILE_FAMILY_ORDER.map((family) => (
                  <button
                    key={family}
                    onClick={() => setSelectedFamily(family)}
                    className={`font-mono text-xs uppercase px-2 py-2 border ${selectedFamily === family ? 'border-amber-300 text-amber-200 bg-amber-300/10' : 'border-white/15 text-white/80'}`}
                  >
                    {family}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 font-mono text-xs uppercase text-white/70">Variants</div>
              <div className="max-h-[340px] space-y-2 overflow-auto pr-1">
                {familyTiles.map((tile) => {
                  const c = tileColors(tile.id);
                  return (
                    <button
                      key={tile.id}
                      onClick={() => setSelectedTileId(tile.id)}
                      className={`w-full text-left border p-2 ${selectedTileId === tile.id ? 'border-emerald-300 bg-emerald-300/10' : 'border-white/10 bg-black/20'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-4 w-8 border" style={{ backgroundColor: c.base, borderColor: c.line }} />
                        <span className="font-mono text-xs text-white">{tile.label}</span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-white/50">{tile.id}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 font-mono text-xs uppercase text-white/70">Zoom</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} className="border border-white/20 px-3 py-1 font-mono text-xs">-</button>
                <input type="range" min={0.5} max={2.5} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-amber-300" />
                <button onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))} className="border border-white/20 px-3 py-1 font-mono text-xs">+</button>
              </div>
              <div className="mt-1 font-mono text-xs text-amber-200/80">{zoom.toFixed(2)}x</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setMapTiles({})}
                className="border border-red-300/40 px-3 py-2 font-mono text-xs uppercase text-red-200 hover:bg-red-300/10"
              >
                Clear Floor
              </button>
              <button
                onClick={() => {
                  const fill: Record<string, string> = {};
                  for (let y = 0; y < GRID_SIZE; y++) for (let x = 0; x < GRID_SIZE; x++) fill[`${x},${y}`] = selectedTileId;
                  setMapTiles(fill);
                }}
                className="border border-emerald-300/40 px-3 py-2 font-mono text-xs uppercase text-emerald-200 hover:bg-emerald-300/10"
              >
                Fill Selected
              </button>
            </div>
          </div>

          <div className="border border-white/10 bg-black/35 p-4">
            <div className="mb-2 font-mono text-xs uppercase text-white/60">
              Click to paint. Current tile: <span className="text-amber-200">{selectedTileId}</span>
            </div>
            <div className="mb-2 font-mono text-[10px] uppercase text-white/40">
              Camera: Fallout 2 fixed view (~25.7deg, locked pseudo-3D)
            </div>
            <canvas
              ref={canvasRef}
              width={980}
              height={760}
              className="w-full h-auto border border-white/10 bg-black cursor-crosshair"
              onMouseMove={(e) => setHovered(toGrid(e.clientX, e.clientY))}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => paintAt(toGrid(e.clientX, e.clientY))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

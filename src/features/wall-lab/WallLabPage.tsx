import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TILE_HEIGHT, TILE_WIDTH } from '../../game/constants';
import { gridToScreen, screenToGrid } from '../../game/engine';
import {
  FALLOUT2_WALL_TYPES,
  WALL_FAMILY_ORDER,
  getWallTypesByFamily,
  type WallFamily,
  type WallTypeDef,
} from '../../game/wallCatalog';

const GRID_SIZE = 20;
const WALL_LAB_CAMERA = {
  scaleY: 0.901,
  skewX: -0.18,
  skewY: 0.02,
};

type WallEdge = 'left' | 'right';
type EncodedWallPlacement = string;

interface DecodedWallPlacement {
  wallId: string;
  edge: WallEdge;
}

function encodePlacement(wallId: string, edge: WallEdge): EncodedWallPlacement {
  return `${wallId}|${edge}`;
}

function decodePlacement(value: string): DecodedWallPlacement {
  const [wallId, edge] = value.split('|');
  return { wallId, edge: edge === 'left' || edge === 'right' ? edge : 'right' };
}

function wallColors(wallId: string) {
  if (wallId.startsWith('tin')) {
    return { top: '#646a70', left: '#3b4148', right: '#2e3339', line: '#1b1f24', accent: '#9ca4ad' };
  }
  if (wallId.startsWith('wood')) {
    return { top: '#7a5b46', left: '#5e4334', right: '#4c3629', line: '#2f2119', accent: '#a67a5e' };
  }
  if (wallId.startsWith('scrap')) {
    return { top: '#5b534e', left: '#403936', right: '#322d2a', line: '#1c1a19', accent: '#8e7f70' };
  }
  if (wallId.startsWith('concrete')) {
    return { top: '#6a6c6f', left: '#4f5155', right: '#3f4145', line: '#25272b', accent: '#909398' };
  }
  if (wallId.startsWith('vault')) {
    return { top: '#5a6672', left: '#3c4753', right: '#2f3944', line: '#1a222a', accent: '#90a2b5' };
  }
  if (wallId.startsWith('adobe')) {
    return { top: '#8a6e57', left: '#6e5543', right: '#5c4638', line: '#392a21', accent: '#bb9a7e' };
  }
  return { top: '#5c6168', left: '#3f444a', right: '#31353b', line: '#1d2024', accent: '#8c949d' };
}

function paintFloorCell(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, hovered: boolean) {
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT);
  ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
  ctx.closePath();

  if (hovered) {
    ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
    ctx.fill();
  }

  ctx.strokeStyle = hovered ? 'rgba(251, 191, 36, 0.75)' : 'rgba(255,255,255,0.12)';
  ctx.lineWidth = hovered ? 1.5 : 1;
  ctx.stroke();
}

function drawWallDetails(
  ctx: CanvasRenderingContext2D,
  wall: WallTypeDef,
  faceCenterX: number,
  topY: number,
  wallHeight: number,
  wallWidth: number,
  edge: WallEdge,
) {
  const colors = wallColors(wall.id);
  const family = wall.family;
  const leftX = faceCenterX - wallWidth / 2;
  const rightX = faceCenterX + wallWidth / 2;
  const bottomY = topY + wallHeight;
  const slant = edge === 'right' ? 3 : -3;

  if (family === 'wood' || wall.id.includes('shack')) {
    ctx.strokeStyle = 'rgba(52, 33, 22, 0.55)';
    for (let x = leftX; x <= rightX; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, topY + 1);
      ctx.lineTo(x + slant, bottomY - 1);
      ctx.stroke();
    }
  }

  if (family === 'tin' || family === 'vault' || family === 'scrap') {
    ctx.strokeStyle = 'rgba(20, 24, 30, 0.6)';
    ctx.lineWidth = 1;
    for (let x = leftX; x <= rightX; x += 7) {
      ctx.beginPath();
      ctx.moveTo(x, topY + 1);
      ctx.lineTo(x + slant, bottomY - 1);
      ctx.stroke();
    }
    ctx.fillStyle = colors.accent;
    ctx.globalAlpha = 0.45;
    [[-12, 9], [-2, 13], [8, 10], [15, 16]].forEach(([dx, dy]) => {
      ctx.fillRect(faceCenterX + dx, topY + dy, 1, 1);
    });
    ctx.globalAlpha = 1;
  }

  if (family === 'concrete' || family === 'adobe') {
    ctx.strokeStyle = 'rgba(32, 28, 24, 0.38)';
    ctx.beginPath();
    ctx.moveTo(faceCenterX - wallWidth * 0.28, topY + 7);
    ctx.lineTo(faceCenterX - wallWidth * 0.14, topY + 13);
    ctx.lineTo(faceCenterX - wallWidth * 0.04, topY + 11);
    ctx.lineTo(faceCenterX + wallWidth * 0.12, topY + 18);
    ctx.stroke();
  }

  if (wall.id.includes('rust') || wall.id.includes('mixed')) {
    ctx.fillStyle = '#8a4b36';
    ctx.globalAlpha = 0.28;
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(leftX + 2 + i * 6, topY + 6 + ((i * 3) % 10), 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  if (wall.id.includes('doorway')) {
    const doorW = Math.max(11, wallWidth * 0.34);
    const doorH = Math.max(16, wallHeight - 7);
    ctx.fillStyle = 'rgba(4, 4, 5, 0.95)';
    ctx.strokeStyle = 'rgba(210, 220, 230, 0.18)';
    ctx.beginPath();
    ctx.rect(faceCenterX - doorW / 2, bottomY - doorH, doorW, doorH);
    ctx.fill();
    ctx.stroke();
  }

  if (wall.id.includes('rebar') || wall.id.includes('reinforced')) {
    ctx.strokeStyle = 'rgba(156, 164, 172, 0.45)';
    ctx.beginPath();
    ctx.moveTo(faceCenterX - wallWidth * 0.2, topY + 4);
    ctx.lineTo(faceCenterX - wallWidth * 0.16 + slant, bottomY - 2);
    ctx.moveTo(faceCenterX + wallWidth * 0.18, topY + 6);
    ctx.lineTo(faceCenterX + wallWidth * 0.14 + slant, bottomY - 2);
    ctx.stroke();
  }
}

function paintWall(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  wall: WallTypeDef,
  edge: WallEdge,
  highlighted: boolean,
  ghost = false,
) {
  const c = wallColors(wall.id);
  const wallHeight = wall.height;

  const A = { x: screenX, y: screenY };
  const B = { x: screenX + TILE_WIDTH / 2, y: screenY + TILE_HEIGHT / 2 };
  const D = { x: screenX - TILE_WIDTH / 2, y: screenY + TILE_HEIGHT / 2 };

  const outer1 = edge === 'right' ? A : D;
  const outer2 = edge === 'right' ? B : A;
  const shift = edge === 'right'
    ? { x: -TILE_WIDTH * 0.15, y: TILE_HEIGHT * 0.15 }
    : { x: TILE_WIDTH * 0.15, y: TILE_HEIGHT * 0.15 };

  const inner1 = { x: outer1.x + shift.x, y: outer1.y + shift.y };
  const inner2 = { x: outer2.x + shift.x, y: outer2.y + shift.y };
  const capOuter1 = { x: outer1.x, y: outer1.y - wallHeight };
  const capOuter2 = { x: outer2.x, y: outer2.y - wallHeight };
  const capInner1 = { x: inner1.x, y: inner1.y - wallHeight };
  const capInner2 = { x: inner2.x, y: inner2.y - wallHeight };

  ctx.save();
  if (ghost) ctx.globalAlpha = 0.45;

  ctx.lineWidth = highlighted ? 2 : 1.2;
  ctx.strokeStyle = highlighted ? '#fcd34d' : c.line;

  // Main vertical face
  ctx.beginPath();
  ctx.moveTo(capOuter1.x, capOuter1.y);
  ctx.lineTo(capOuter2.x, capOuter2.y);
  ctx.lineTo(outer2.x, outer2.y);
  ctx.lineTo(outer1.x, outer1.y);
  ctx.closePath();
  ctx.fillStyle = edge === 'right' ? c.right : c.left;
  ctx.fill();
  ctx.stroke();

  // Thin top cap
  ctx.beginPath();
  ctx.moveTo(capOuter1.x, capOuter1.y);
  ctx.lineTo(capOuter2.x, capOuter2.y);
  ctx.lineTo(capInner2.x, capInner2.y);
  ctx.lineTo(capInner1.x, capInner1.y);
  ctx.closePath();
  ctx.fillStyle = c.top;
  ctx.fill();
  ctx.stroke();

  // Inner thickness face
  ctx.beginPath();
  ctx.moveTo(capInner1.x, capInner1.y);
  ctx.lineTo(capInner2.x, capInner2.y);
  ctx.lineTo(inner2.x, inner2.y);
  ctx.lineTo(inner1.x, inner1.y);
  ctx.closePath();
  ctx.fillStyle = edge === 'right' ? c.left : c.right;
  ctx.globalAlpha *= 0.8;
  ctx.fill();
  ctx.globalAlpha = ghost ? 0.45 : 1;
  ctx.stroke();

  const faceCenterX = (capOuter1.x + capOuter2.x + outer1.x + outer2.x) / 4;
  const faceTopY = (capOuter1.y + capOuter2.y) / 2;
  const faceBottomY = (outer1.y + outer2.y) / 2;
  const faceWidth = Math.hypot(capOuter2.x - capOuter1.x, capOuter2.y - capOuter1.y);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(capOuter1.x, capOuter1.y);
  ctx.lineTo(capOuter2.x, capOuter2.y);
  ctx.lineTo(outer2.x, outer2.y);
  ctx.lineTo(outer1.x, outer1.y);
  ctx.closePath();
  ctx.clip();
  drawWallDetails(ctx, wall, faceCenterX, faceTopY, faceBottomY - faceTopY, faceWidth, edge);
  ctx.restore();

  // Highlight and contact line
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(capOuter1.x, capOuter1.y);
  ctx.lineTo(capOuter2.x, capOuter2.y);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.moveTo(outer1.x, outer1.y);
  ctx.lineTo(outer2.x, outer2.y);
  ctx.stroke();

  // Vertical studs for scale/readability
  ctx.strokeStyle = c.line;
  ctx.lineWidth = highlighted ? 1.5 : 1;
  const postCount = Math.max(2, Math.floor(faceWidth / 16));
  for (let i = 1; i <= postCount; i++) {
    const t = i / (postCount + 1);
    const bx = outer1.x + (outer2.x - outer1.x) * t;
    const by = outer1.y + (outer2.y - outer1.y) * t;
    const tx = capOuter1.x + (capOuter2.x - capOuter1.x) * t;
    const ty = capOuter1.y + (capOuter2.y - capOuter1.y) * t;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  ctx.restore();
}

function paintPlayerReference(ctx: CanvasRenderingContext2D, screenX: number, screenY: number) {
  const footX = screenX;
  const footY = screenY + TILE_HEIGHT / 2 + 2;

  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#05070a';
  ctx.beginPath();
  ctx.ellipse(footX, footY + 2, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(12, 12, 16, 0.9)';

  ctx.fillStyle = '#183f86';
  ctx.beginPath();
  ctx.moveTo(footX - 4, footY - 1);
  ctx.lineTo(footX - 1, footY - 1);
  ctx.lineTo(footX - 1, footY - 12);
  ctx.lineTo(footX - 4, footY - 11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(footX + 1, footY - 1);
  ctx.lineTo(footX + 4, footY - 1);
  ctx.lineTo(footX + 4, footY - 12);
  ctx.lineTo(footX + 1, footY - 11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1f52ad';
  ctx.beginPath();
  ctx.moveTo(footX - 6, footY - 12);
  ctx.lineTo(footX + 6, footY - 12);
  ctx.lineTo(footX + 5, footY - 25);
  ctx.lineTo(footX - 5, footY - 25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f3c64a';
  ctx.fillRect(footX - 1, footY - 25, 2, 13);
  ctx.fillRect(footX - 4, footY - 19, 8, 2);

  ctx.strokeStyle = '#c8b295';
  ctx.beginPath();
  ctx.moveTo(footX - 4, footY - 22);
  ctx.lineTo(footX - 8, footY - 16);
  ctx.moveTo(footX + 4, footY - 22);
  ctx.lineTo(footX + 8, footY - 16);
  ctx.stroke();

  ctx.fillStyle = '#c8b295';
  ctx.beginPath();
  ctx.arc(footX, footY - 29, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#d6d8dc';
  ctx.fillText('Vault Dweller', footX, footY - 37);

  ctx.strokeStyle = '#07140d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(footX - 14, footY - 34);
  ctx.lineTo(footX + 14, footY - 34);
  ctx.stroke();

  ctx.strokeStyle = '#59db84';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(footX - 14, footY - 34);
  ctx.lineTo(footX + 14, footY - 34);
  ctx.stroke();
  ctx.restore();
}

export function WallLabPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedFamily, setSelectedFamily] = useState<WallFamily>('tin');
  const [selectedWallId, setSelectedWallId] = useState(FALLOUT2_WALL_TYPES[0].id);
  const [selectedEdge, setSelectedEdge] = useState<WallEdge>('right');
  const [zoom, setZoom] = useState(1);
  const [hovered, setHovered] = useState<{ x: number; y: number } | null>(null);
  const [mapWalls, setMapWalls] = useState<Record<string, EncodedWallPlacement>>({});
  const [brushMode, setBrushMode] = useState<'paint' | 'erase'>('paint');
  const [showPlayerRef, setShowPlayerRef] = useState(true);
  const [playerRefPos, setPlayerRefPos] = useState({ x: 9, y: 9 });

  const familyWalls = useMemo(() => getWallTypesByFamily(selectedFamily), [selectedFamily]);
  const wallById = useMemo(() => new Map(FALLOUT2_WALL_TYPES.map((wall) => [wall.id, wall])), []);

  useEffect(() => {
    if (!familyWalls.some((w) => w.id === selectedWallId)) {
      setSelectedWallId(familyWalls[0]?.id || selectedWallId);
    }
  }, [familyWalls, selectedWallId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bg = ctx.createRadialGradient(canvas.width * 0.15, 80, 60, canvas.width / 2, canvas.height / 2, canvas.height);
    bg.addColorStop(0, '#1f1711');
    bg.addColorStop(0.45, '#090b10');
    bg.addColorStop(1, '#050608');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, 70);
    ctx.scale(zoom, zoom);
    ctx.transform(1, WALL_LAB_CAMERA.skewY, WALL_LAB_CAMERA.skewX, WALL_LAB_CAMERA.scaleY, 0, 0);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const screen = gridToScreen(x, y);
        const isHovered = hovered?.x === x && hovered?.y === y;
        paintFloorCell(ctx, screen.x, screen.y, isHovered);
      }
    }

    const placedWalls = Object.entries(mapWalls as Record<string, string>)
      .map(([key, encoded]) => {
        const [xStr, yStr] = key.split(',');
        const placement = decodePlacement(encoded);
        const wall = wallById.get(placement.wallId);
        if (!wall) return null;
        return { x: Number(xStr), y: Number(yStr), wall, edge: placement.edge };
      })
      .filter((entry): entry is { x: number; y: number; wall: WallTypeDef; edge: WallEdge } => entry !== null)
      .sort((a, b) => (a.x + a.y) - (b.x + b.y) || a.x - b.x);

    for (const entry of placedWalls) {
      const screen = gridToScreen(entry.x, entry.y);
      const isHovered = hovered?.x === entry.x && hovered?.y === entry.y;
      paintWall(ctx, screen.x, screen.y, entry.wall, entry.edge, isHovered);
    }

    if (showPlayerRef) {
      const playerScreen = gridToScreen(playerRefPos.x, playerRefPos.y);
      paintPlayerReference(ctx, playerScreen.x, playerScreen.y);
    }

    if (brushMode === 'paint' && hovered) {
      const preview = wallById.get(selectedWallId);
      if (preview) {
        const screen = gridToScreen(hovered.x, hovered.y);
        paintWall(ctx, screen.x, screen.y, preview, selectedEdge, true, true);
      }
    }

    ctx.restore();
  }, [brushMode, hovered, mapWalls, playerRefPos, selectedEdge, selectedWallId, showPlayerRef, wallById, zoom]);

  const toGrid = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const localX = (clientX - rect.left - canvas.width / 2) / zoom;
    const localY = (clientY - rect.top - 70) / zoom;
    const a = 1;
    const b = WALL_LAB_CAMERA.skewY;
    const c = WALL_LAB_CAMERA.skewX;
    const d = WALL_LAB_CAMERA.scaleY;
    const det = a * d - b * c;
    const projX = (d * localX - c * localY) / det;
    const projY = (-b * localX + a * localY) / det;
    const grid = screenToGrid(projX, projY);
    if (grid.x < 0 || grid.y < 0 || grid.x >= GRID_SIZE || grid.y >= GRID_SIZE) return null;
    return { x: grid.x, y: grid.y };
  };

  const paintAt = (grid: { x: number; y: number } | null) => {
    if (!grid) return;
    const key = `${grid.x},${grid.y}`;
    if (brushMode === 'erase') {
      setMapWalls((prev) => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    setMapWalls((prev) => ({ ...prev, [key]: encodePlacement(selectedWallId, selectedEdge) }));
  };

  const selectedWall = wallById.get(selectedWallId) || FALLOUT2_WALL_TYPES[0];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,#211615_0%,#090b10_42%,#050608_100%)] text-white p-4">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-4 flex items-center justify-between gap-3 border border-white/10 bg-black/35 p-4">
          <div>
            <h1 className="font-mono text-xl uppercase tracking-wide text-emerald-200">Wall Lab</h1>
            <p className="font-mono text-xs text-white/60">Paint Fallout-style edge walls onto an isometric layout grid</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/tile-lab.html" className="font-mono text-xs uppercase border border-amber-300/40 px-3 py-2 text-amber-200 hover:bg-amber-300/10">
              Tile Lab
            </a>
            <a href="/" className="font-mono text-xs uppercase border border-white/20 px-3 py-2 text-white/80 hover:bg-white/5">
              Main App
            </a>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <div className="space-y-4 border border-white/10 bg-black/35 p-4">
            <div>
              <div className="mb-2 font-mono text-xs uppercase text-white/70">Wall Family</div>
              <div className="grid grid-cols-2 gap-2">
                {WALL_FAMILY_ORDER.map((family) => (
                  <button
                    key={family}
                    onClick={() => setSelectedFamily(family)}
                    className={`font-mono text-xs uppercase px-2 py-2 border ${selectedFamily === family ? 'border-emerald-300 text-emerald-200 bg-emerald-300/10' : 'border-white/15 text-white/80'}`}
                  >
                    {family}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 font-mono text-xs uppercase text-white/70">Variants</div>
              <div className="max-h-[300px] space-y-2 overflow-auto pr-1">
                {familyWalls.map((wall) => {
                  const c = wallColors(wall.id);
                  return (
                    <button
                      key={wall.id}
                      onClick={() => setSelectedWallId(wall.id)}
                      className={`w-full text-left border p-2 ${selectedWallId === wall.id ? 'border-emerald-300 bg-emerald-300/10' : 'border-white/10 bg-black/20'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex gap-0.5">
                          <span className="inline-block h-4 w-3 border" style={{ backgroundColor: c.left, borderColor: c.line }} />
                          <span className="inline-block h-4 w-3 border" style={{ backgroundColor: c.top, borderColor: c.line }} />
                          <span className="inline-block h-4 w-3 border" style={{ backgroundColor: c.right, borderColor: c.line }} />
                        </span>
                        <span className="font-mono text-xs text-white">{wall.label}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-white/50">
                        <span>{wall.id}</span>
                        <span>h:{wall.height}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 font-mono text-xs uppercase text-white/70">Brush</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBrushMode('paint')}
                  className={`border px-3 py-2 font-mono text-xs uppercase ${brushMode === 'paint' ? 'border-amber-300 text-amber-200 bg-amber-300/10' : 'border-white/15 text-white/80'}`}
                >
                  Paint
                </button>
                <button
                  onClick={() => setBrushMode('erase')}
                  className={`border px-3 py-2 font-mono text-xs uppercase ${brushMode === 'erase' ? 'border-red-300 text-red-200 bg-red-300/10' : 'border-white/15 text-white/80'}`}
                >
                  Erase
                </button>
              </div>
            </div>

            <div>
              <div className="mb-2 font-mono text-xs uppercase text-white/70">Wall Direction</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedEdge('left')}
                  className={`border px-3 py-2 font-mono text-xs uppercase ${selectedEdge === 'left' ? 'border-emerald-300 text-emerald-200 bg-emerald-300/10' : 'border-white/15 text-white/80'}`}
                  title="NW/SW-facing strip"
                >
                  \ Edge
                </button>
                <button
                  onClick={() => setSelectedEdge('right')}
                  className={`border px-3 py-2 font-mono text-xs uppercase ${selectedEdge === 'right' ? 'border-emerald-300 text-emerald-200 bg-emerald-300/10' : 'border-white/15 text-white/80'}`}
                  title="NE/SE-facing strip"
                >
                  / Edge
                </button>
              </div>
            </div>

            <div>
              <div className="mb-2 font-mono text-xs uppercase text-white/70">Player Reference</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowPlayerRef((v) => !v)}
                  className={`border px-3 py-2 font-mono text-xs uppercase ${showPlayerRef ? 'border-sky-300 text-sky-200 bg-sky-300/10' : 'border-white/15 text-white/80'}`}
                >
                  {showPlayerRef ? 'Shown' : 'Hidden'}
                </button>
                <button
                  onClick={() => setPlayerRefPos({ x: 9, y: 9 })}
                  className="border border-white/15 px-3 py-2 font-mono text-xs uppercase text-white/80"
                >
                  Center
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => setPlayerRefPos((p) => ({ ...p, y: Math.max(0, p.y - 1) }))} className="flex-1 border border-white/15 px-2 py-1 font-mono text-xs">Y-</button>
                <button onClick={() => setPlayerRefPos((p) => ({ ...p, x: Math.max(0, p.x - 1) }))} className="flex-1 border border-white/15 px-2 py-1 font-mono text-xs">X-</button>
                <button onClick={() => setPlayerRefPos((p) => ({ ...p, x: Math.min(GRID_SIZE - 1, p.x + 1) }))} className="flex-1 border border-white/15 px-2 py-1 font-mono text-xs">X+</button>
                <button onClick={() => setPlayerRefPos((p) => ({ ...p, y: Math.min(GRID_SIZE - 1, p.y + 1) }))} className="flex-1 border border-white/15 px-2 py-1 font-mono text-xs">Y+</button>
              </div>
              <div className="mt-1 font-mono text-[10px] text-white/50">Grid: {playerRefPos.x},{playerRefPos.y}</div>
            </div>

            <div>
              <div className="mb-2 font-mono text-xs uppercase text-white/70">Zoom</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} className="border border-white/20 px-3 py-1 font-mono text-xs">-</button>
                <input type="range" min={0.5} max={2.5} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-emerald-300" />
                <button onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))} className="border border-white/20 px-3 py-1 font-mono text-xs">+</button>
              </div>
              <div className="mt-1 font-mono text-xs text-emerald-200/80">{zoom.toFixed(2)}x</div>
            </div>

            <div className="border border-white/10 bg-black/20 p-3">
              <div className="font-mono text-xs uppercase text-white/70">Selection</div>
              <div className="mt-2 font-mono text-xs text-emerald-200">{selectedWall.label}</div>
              <div className="mt-1 font-mono text-[10px] text-white/50">{selectedWall.id}</div>
              <div className="mt-1 font-mono text-[10px] text-white/50">Height: {selectedWall.height}px • Edge: {selectedEdge}</div>
              <div className="mt-1 font-mono text-[10px] text-white/40">{selectedWall.tags.join(' • ')}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setMapWalls({})}
                className="border border-red-300/40 px-3 py-2 font-mono text-xs uppercase text-red-200 hover:bg-red-300/10"
              >
                Clear Walls
              </button>
              <button
                onClick={() => {
                  const fill: Record<string, EncodedWallPlacement> = {};
                  for (let y = 0; y < GRID_SIZE; y++) for (let x = 0; x < GRID_SIZE; x++) fill[`${x},${y}`] = encodePlacement(selectedWallId, selectedEdge);
                  setMapWalls(fill);
                }}
                className="border border-emerald-300/40 px-3 py-2 font-mono text-xs uppercase text-emerald-200 hover:bg-emerald-300/10"
              >
                Fill Selected
              </button>
            </div>

            <button
              onClick={() => {
                const next: Record<string, EncodedWallPlacement> = {};
                const min = 5;
                const max = 14;
                for (let y = min; y <= max; y++) {
                  for (let x = min; x <= max; x++) {
                    if (y === min || y === max) next[`${x},${y}`] = encodePlacement(selectedWallId, 'right');
                    if (x === min || x === max) next[`${x},${y}`] = encodePlacement(selectedWallId, 'left');
                  }
                }
                delete next[`${Math.floor((min + max) / 2)},${min}`];
                setMapWalls(next);
                setPlayerRefPos({ x: Math.floor((min + max) / 2), y: Math.floor((min + max) / 2) });
              }}
              className="w-full border border-amber-300/40 px-3 py-2 font-mono text-xs uppercase text-amber-200 hover:bg-amber-300/10"
            >
              Stamp Room Shell
            </button>
          </div>

          <div className="border border-white/10 bg-black/35 p-4">
            <div className="mb-2 font-mono text-xs uppercase text-white/60">
              Click to {brushMode === 'paint' ? 'paint walls' : 'erase walls'}. Placed: <span className="text-emerald-200">{Object.keys(mapWalls).length}</span>
            </div>
            <div className="mb-2 font-mono text-[10px] uppercase text-white/40">
              Camera: Fallout 2 fixed view (~25.7deg, locked pseudo-3D) • Right click to erase • Edge brush uses / and \ toggles
            </div>
            <canvas
              ref={canvasRef}
              width={980}
              height={760}
              className="w-full h-auto border border-white/10 bg-black cursor-crosshair"
              onMouseMove={(e) => setHovered(toGrid(e.clientX, e.clientY))}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => paintAt(toGrid(e.clientX, e.clientY))}
              onContextMenu={(e) => {
                e.preventDefault();
                const grid = toGrid(e.clientX, e.clientY);
                if (!grid) return;
                const key = `${grid.x},${grid.y}`;
                setMapWalls((prev) => {
                  if (!(key in prev)) return prev;
                  const next = { ...prev };
                  delete next[key];
                  return next;
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

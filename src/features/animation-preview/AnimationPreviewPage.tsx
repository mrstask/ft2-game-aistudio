import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getPlayerPose, type AnimationMode } from '../../game/animation';
import type { Entity } from '../../game/types';

type Facing = NonNullable<Entity['facing']>;
type ViewMode = 'fallout2' | '2d' | '25d-left' | '25d-right' | '25d-steep';

const FACINGS: Facing[] = ['s', 'n', 'w', 'e', 'sw', 'se', 'nw', 'ne'];

const VIEW_PRESETS: Record<ViewMode, { scaleY: number; skewX: number; skewY: number; label: string; notes?: string }> = {
  // Fallout-style fixed camera approximation (pseudo-3D / dimetric-ish):
  // based on user-provided reference: ~25.7deg elevation and slightly rotated vs true isometric.
  fallout2: { scaleY: 0.901, skewX: -0.18, skewY: 0.02, label: 'Fallout 2', notes: '~25.7deg fixed camera' },
  '2d': { scaleY: 1, skewX: 0, skewY: 0, label: '2D' },
  '25d-left': { scaleY: 0.86, skewX: -0.22, skewY: 0.03, label: '2.5D Left' },
  '25d-right': { scaleY: 0.86, skewX: 0.22, skewY: -0.03, label: '2.5D Right' },
  '25d-steep': { scaleY: 0.78, skewX: -0.14, skewY: 0.02, label: '2.5D Steep' },
};

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  t: number,
  centerX: number,
  centerY: number,
  previewMode: AnimationMode,
  zoom: number,
  viewMode: ViewMode,
) {
  const pose = getPlayerPose(entity, t, previewMode);
  const facing = entity.facing || 's';
  const isBack = ['n', 'ne', 'nw'].includes(facing);
  const flip = ['e', 'ne', 'se'].includes(facing);

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Background
  ctx.fillStyle = '#0f1115';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const view = VIEW_PRESETS[viewMode];
  const project = (wx: number, wy: number) => {
    // Apply the same pseudo-3D camera transform to world (pane) points.
    const px = wx + view.skewX * wy;
    const py = view.skewY * wx + view.scaleY * wy;
    return { x: centerX + px * zoom, y: centerY + py * zoom };
  };

  // Draw projected pane (ground plane + grid) first, so camera angle is visible on the actual floor.
  ctx.save();
  ctx.strokeStyle = 'rgba(120, 132, 150, 0.14)';
  ctx.fillStyle = 'rgba(18, 22, 28, 0.55)';
  const paneRadius = 170;
  const paneCorners = [
    project(0, -paneRadius),
    project(paneRadius, 0),
    project(0, paneRadius),
    project(-paneRadius, 0),
  ];
  ctx.beginPath();
  ctx.moveTo(paneCorners[0].x, paneCorners[0].y);
  for (let i = 1; i < paneCorners.length; i++) ctx.lineTo(paneCorners[i].x, paneCorners[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Sparse pane grid only (reduced line density).
  for (let i = -4; i <= 4; i++) {
    const a = project(i * 28, -112);
    const b = project(i * 28, 112);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    const c = project(-112, i * 28);
    const d = project(112, i * 28);
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.stroke();
  }
  ctx.restore();

  const anchor = project(0, 0);

  // Projected shadow on the pane (not on the upright character billboard).
  ctx.save();
  ctx.translate(anchor.x, anchor.y);
  ctx.transform(1, view.skewY, view.skewX, view.scaleY, 0, 0);
  ctx.scale(zoom, zoom);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw character as an upright billboard sprite anchored onto the projected pane (Fallout-like read).
  ctx.save();
  ctx.translate(anchor.x + pose.sway * zoom, anchor.y + pose.bob * zoom);
  ctx.scale(zoom, zoom);
  if (flip) ctx.scale(-1, 1);
  ctx.rotate(pose.torsoTilt);
  ctx.scale(pose.bodyScaleX, 1);

  // Metallic power-armor palette (inspired by Fallout armor silhouette)
  const armorDark = '#4a4f53';
  const armorMid = '#7a8086';
  const armorLight = '#b4bcc1';
  const armorJoint = '#2a2f34';
  const visorGlow = '#b8f85f';

  // Legs
  const leftLegY = 0 + Math.max(0, pose.leftLegLift);
  const rightLegY = 0 + Math.max(0, pose.rightLegLift);
  const leftLegHeight = 12 + Math.max(0, pose.rightLegLift) * 0.5;
  const rightLegHeight = 12 + Math.max(0, pose.leftLegLift) * 0.5;
  ctx.fillStyle = armorJoint;
  ctx.fillRect(-7 - pose.hipOffsetX, leftLegY + 1, 5 * pose.strideCompressX, leftLegHeight);
  ctx.fillRect(2 + pose.hipOffsetX, rightLegY + 1, 5 * pose.strideCompressX, rightLegHeight);
  ctx.fillStyle = armorMid;
  ctx.fillRect(-7 - pose.hipOffsetX, leftLegY, 5 * pose.strideCompressX, 6);
  ctx.fillRect(2 + pose.hipOffsetX, rightLegY, 5 * pose.strideCompressX, 6);
  ctx.fillStyle = armorLight;
  ctx.fillRect(-6 - pose.hipOffsetX, leftLegY + leftLegHeight - 4, 3 * pose.strideCompressX, 4);
  ctx.fillRect(3 + pose.hipOffsetX, rightLegY + rightLegHeight - 4, 3 * pose.strideCompressX, 4);

  // Hip / codpiece block
  ctx.fillStyle = armorDark;
  ctx.fillRect(-6, -2 + pose.torsoLeanY, 12, 6);
  ctx.fillStyle = armorLight;
  ctx.fillRect(-2, -1 + pose.torsoLeanY, 4, 3);

  // Torso core
  ctx.fillStyle = armorMid;
  ctx.fillRect(-8 - pose.shoulderOffsetX, -17 + pose.torsoLeanY, 16 + pose.shoulderOffsetX * 2, 18);
  ctx.fillStyle = armorDark;
  ctx.fillRect(-5, -14 + pose.torsoLeanY, 10, 11);
  ctx.fillStyle = armorLight;
  ctx.fillRect(-7, -16 + pose.torsoLeanY, 14, 3);
  ctx.fillRect(-7, -1 + pose.torsoLeanY, 14, 2);

  // Chest details / vents
  if (isBack) {
    ctx.fillStyle = armorJoint;
    ctx.fillRect(-4, -12 + pose.torsoLeanY, 8, 7);
    ctx.fillStyle = '#6ee7b7';
    ctx.fillRect(-1, -9 + pose.torsoLeanY, 2, 2);
  } else {
    ctx.fillStyle = armorJoint;
    ctx.fillRect(-5, -12 + pose.torsoLeanY, 10, 6);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-1, -10 + pose.torsoLeanY, 2, 2);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-4, -7 + pose.torsoLeanY, 2, 1);
    ctx.fillRect(2, -7 + pose.torsoLeanY, 2, 1);
  }

  // Shoulder pauldrons
  ctx.fillStyle = armorMid;
  ctx.beginPath();
  ctx.ellipse(-9 - pose.shoulderOffsetX, -13 + pose.torsoLeanY, 5, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(9 + pose.shoulderOffsetX, -13 + pose.torsoLeanY, 5, 4, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = armorLight;
  ctx.fillRect(-12 - pose.shoulderOffsetX, -15 + pose.torsoLeanY, 4, 2);
  ctx.fillRect(8 + pose.shoulderOffsetX, -15 + pose.torsoLeanY, 4, 2);

  // Arms
  ctx.save();
  ctx.rotate(pose.rightArmAngle);
  ctx.fillStyle = armorJoint;
  ctx.fillRect(7 + pose.shoulderOffsetX, -12 + pose.torsoLeanY, 4, 12);
  ctx.fillStyle = armorMid;
  ctx.fillRect(6 + pose.shoulderOffsetX, -14 + pose.torsoLeanY, 5, 6);
  ctx.fillStyle = armorLight;
  ctx.fillRect(7 + pose.shoulderOffsetX, -3 + pose.torsoLeanY, 4, 2);
  ctx.restore();

  ctx.save();
  ctx.rotate(pose.leftArmAngle);
  ctx.fillStyle = armorJoint;
  ctx.fillRect(-11 - pose.shoulderOffsetX, -12 + pose.torsoLeanY, 4, 12);
  ctx.fillStyle = armorMid;
  ctx.fillRect(-11 - pose.shoulderOffsetX, -14 + pose.torsoLeanY, 5, 6);
  ctx.fillStyle = armorLight;
  ctx.fillRect(-11 - pose.shoulderOffsetX, -3 + pose.torsoLeanY, 4, 2);
  ctx.restore();

  // Helmet / head
  const hx = pose.headOffsetX;
  const hy = -23 + pose.headOffsetY + pose.torsoLeanY;
  ctx.fillStyle = armorDark;
  ctx.beginPath();
  ctx.ellipse(hx, hy, 7, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = armorMid;
  ctx.beginPath();
  ctx.ellipse(hx, hy - 1, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = armorLight;
  ctx.fillRect(hx - 4, hy - 6, 6, 2);
  ctx.fillRect(hx - 6, hy - 1, 2, 3);

  if (isBack) {
    ctx.fillStyle = armorJoint;
    ctx.fillRect(hx - 4, hy, 8, 4);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(hx - 1, hy + 1, 2, 1);
  } else {
    ctx.fillStyle = armorJoint;
    ctx.fillRect(hx - 4, hy - 1, 8, 3);
    ctx.fillStyle = visorGlow;
    ctx.fillRect(hx + 1, hy - 1, 3, 1);
    if (!flip) {
      ctx.fillRect(hx + 3, hy - 2, 1, 1);
    }
  }

  ctx.restore();

  // Debug labels
  ctx.fillStyle = '#d1fae5';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`mode: ${previewMode}`, 16, 22);
  ctx.fillText(`facing: ${facing}`, 16, 40);
  ctx.fillText(`view: ${VIEW_PRESETS[viewMode].label}`, 16, 58);
  if (VIEW_PRESETS[viewMode].notes) {
    ctx.fillText(VIEW_PRESETS[viewMode].notes!, 16, 76);
  }
}

export function AnimationPreviewPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewMode, setPreviewMode] = useState<AnimationMode>('idle');
  const [facing, setFacing] = useState<Facing>('se');
  const [autoFacing, setAutoFacing] = useState(true);
  const [zoom, setZoom] = useState(4);
  const [viewMode, setViewMode] = useState<ViewMode>('fallout2');

  const entity = useMemo<Entity>(
    () => ({
      id: 'preview-player',
      type: 'player',
      name: 'Vault Dweller',
      gridX: 0,
      gridY: 0,
      hp: 100,
      maxHp: 100,
      ap: 10,
      maxAp: 10,
      ac: 5,
      isMoving: previewMode !== 'idle',
      facing,
      movementType: 'bipedal',
      size: 'medium',
    }),
    [facing, previewMode],
  );

  useEffect(() => {
    if (!autoFacing) return;
    const timer = window.setInterval(() => {
      setFacing((current) => {
        const idx = FACINGS.indexOf(current);
        return FACINGS[(idx + 1) % FACINGS.length];
      });
    }, 3000);
    return () => window.clearInterval(timer);
  }, [autoFacing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const render = () => {
      drawPlayer(ctx, entity, performance.now() / 1000, canvas.width / 2, canvas.height / 2 + 50, previewMode, zoom, viewMode);
      raf = window.requestAnimationFrame(render);
    };
    raf = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(raf);
  }, [entity, previewMode, zoom, viewMode]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_15%,#1f2937_0%,#090b10_45%,#05070a_100%)] text-white p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-black/30 p-4 backdrop-blur">
          <div>
            <h1 className="font-mono text-xl tracking-wide text-emerald-300 uppercase">Character Motion Preview</h1>
            <p className="font-mono text-xs text-emerald-100/60">Standalone page for player idle/walk animation model</p>
          </div>
          <a href="/" className="font-mono text-xs uppercase border border-emerald-300/40 px-3 py-2 text-emerald-200 hover:bg-emerald-300/10">
            Main App
          </a>
        </div>

        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="border border-white/10 bg-black/35 p-4">
            <div className="mb-4 font-mono text-xs uppercase text-white/70">State</div>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode('idle')}
                className={`font-mono text-xs uppercase px-3 py-2 border ${previewMode === 'idle' ? 'border-emerald-300 text-emerald-200 bg-emerald-300/10' : 'border-white/20 text-white/80'}`}
              >
                Standing
              </button>
              <button
                onClick={() => setPreviewMode('walk')}
                className={`font-mono text-xs uppercase px-3 py-2 border ${previewMode === 'walk' ? 'border-emerald-300 text-emerald-200 bg-emerald-300/10' : 'border-white/20 text-white/80'}`}
              >
                Walking
              </button>
              <button
                onClick={() => setPreviewMode('run')}
                className={`font-mono text-xs uppercase px-3 py-2 border ${previewMode === 'run' ? 'border-emerald-300 text-emerald-200 bg-emerald-300/10' : 'border-white/20 text-white/80'}`}
              >
                Running
              </button>
            </div>

            <div className="mt-6 mb-2 font-mono text-xs uppercase text-white/70">Auto Facing</div>
            <button
              onClick={() => setAutoFacing((v) => !v)}
              className={`font-mono text-xs uppercase px-3 py-2 border ${autoFacing ? 'border-cyan-300 text-cyan-200 bg-cyan-300/10' : 'border-white/20 text-white/80'}`}
            >
              {autoFacing ? 'On (3s switch)' : 'Off'}
            </button>

            <div className="mt-6 mb-2 font-mono text-xs uppercase text-white/70">Facing</div>
            <div className="grid grid-cols-4 gap-2">
              {FACINGS.map((dir) => (
                <button
                  key={dir}
                  onClick={() => setFacing(dir)}
                  className={`font-mono text-xs uppercase px-2 py-2 border ${facing === dir ? 'border-amber-300 text-amber-200 bg-amber-300/10' : 'border-white/20 text-white/80'}`}
                >
                  {dir}
                </button>
              ))}
            </div>

            <div className="mt-6 mb-2 font-mono text-xs uppercase text-white/70">Zoom</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))}
                  className="font-mono text-xs uppercase px-3 py-2 border border-white/20 text-white/80"
                >
                  -
                </button>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-emerald-300"
                />
                <button
                  onClick={() => setZoom((z) => Math.min(10, +(z + 0.5).toFixed(1)))}
                  className="font-mono text-xs uppercase px-3 py-2 border border-white/20 text-white/80"
                >
                  +
                </button>
              </div>
              <div className="font-mono text-xs text-emerald-200/80">{zoom.toFixed(1)}x</div>
            </div>

            <div className="mt-6 mb-2 font-mono text-xs uppercase text-white/70">View</div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(VIEW_PRESETS) as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`font-mono text-xs uppercase px-2 py-2 border ${viewMode === mode ? 'border-sky-300 text-sky-200 bg-sky-300/10' : 'border-white/20 text-white/80'}`}
                >
                  {VIEW_PRESETS[mode].label}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-white/10 bg-black/35 p-4">
            <canvas
              ref={canvasRef}
              width={900}
              height={520}
              className="w-full h-auto border border-white/10 bg-black"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

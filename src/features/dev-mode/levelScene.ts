import { TILE_HEIGHT, TILE_WIDTH } from '../../game/constants';
import { gridToScreen, screenToGrid } from '../../game/engine';
import { FALLOUT2_WALL_TYPES } from '../../game/wallCatalog';
import {
  DEFAULT_TILE_ID,
  getWallSpan,
  INTERIOR_CATALOG,
  wallSpanStep,
  type InteriorDef,
  type LevelEditorData,
  type LevelInteriorPlacement,
  type LevelWallPlacement,
  type CornerOrientation,
  type WallEdge,
  type WallItem,
} from './data';

export const LEVEL_SCENE_CAMERA = {
  // Trimetric-style camera: unequal axis foreshortening/skew to match Fallout-like mapper look.
  scaleY: 0.78,
  skewX: -0.32,
  skewY: 0.08,
};

export const LEVEL_SCENE_ORIGIN = { x: 500, y: 92 };

const WALL_MAP = new Map(FALLOUT2_WALL_TYPES.map((wall) => [wall.id, wall]));
const INTERIOR_MAP = new Map(INTERIOR_CATALOG.map((interior) => [interior.id, interior]));

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hash01(seed: number, salt: number): number {
  const x = Math.imul(seed ^ salt, 1597334677);
  return ((x ^ (x >>> 13)) >>> 0) / 4294967295;
}

function worldLiftForScreenVertical(height: number) {
  const a = 1;
  const b = LEVEL_SCENE_CAMERA.skewY;
  const c = LEVEL_SCENE_CAMERA.skewX;
  const d = LEVEL_SCENE_CAMERA.scaleY;
  const det = a * d - b * c;
  // Inverse(M) * [0, -height]: world-space lift that appears vertical on screen.
  return {
    x: (c * height) / det,
    y: (-a * height) / det,
  };
}

function tileColor(tileId: string): { fill: string; line: string; accent: string } {
  if (tileId.startsWith('dirt')) return { fill: '#6d5c4d', line: '#2e261f', accent: '#86725f' };
  if (tileId.startsWith('metal') || tileId.startsWith('industrial') || tileId.startsWith('grate')) return { fill: '#56616d', line: '#242b33', accent: '#6f7b88' };
  if (tileId.startsWith('stone') || tileId.startsWith('cement')) return { fill: '#61656d', line: '#2e3239', accent: '#7a7f88' };
  if (tileId.startsWith('wood')) return { fill: '#7c5b44', line: '#3a2a1f', accent: '#9a7457' };
  if (tileId.startsWith('road')) return { fill: '#424851', line: '#1f252c', accent: '#5d656f' };
  if (tileId.startsWith('roof')) return { fill: '#7a7166', line: '#39342e', accent: '#988b7f' };
  return { fill: '#535a64', line: '#252a31', accent: '#68727f' };
}

function wallColors(wallId: string) {
  if (wallId.startsWith('ruins-stone-plain')) return { top: '#76665a', left: '#604f44', right: '#56463d', line: '#2d2420' };
  if (wallId.startsWith('ruins-stone-cracked')) return { top: '#736054', left: '#5b493f', right: '#514137', line: '#2a221d' };
  if (wallId.startsWith('ruins-stone-moss')) return { top: '#6e6257', left: '#584c42', right: '#4d4138', line: '#28211d' };
  if (wallId.startsWith('ruins-stone-engraved')) return { top: '#7e6b5d', left: '#665447', right: '#5a4a40', line: '#312721' };
  if (wallId.startsWith('tin')) return { top: '#646a70', left: '#3b4148', right: '#2e3339', line: '#1b1f24' };
  if (wallId.startsWith('wood')) return { top: '#7a5b46', left: '#5e4334', right: '#4c3629', line: '#2f2119' };
  if (wallId.startsWith('scrap')) return { top: '#5b534e', left: '#403936', right: '#322d2a', line: '#1c1a19' };
  if (wallId.startsWith('concrete')) return { top: '#6a6c6f', left: '#4f5155', right: '#3f4145', line: '#25272b' };
  if (wallId.startsWith('vault')) return { top: '#5a6672', left: '#3c4753', right: '#2f3944', line: '#1a222a' };
  return { top: '#8a6e57', left: '#6e5543', right: '#5c4638', line: '#392a21' };
}

function paintTile(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, tileId: string, hovered: boolean) {
  const c = tileColor(tileId);
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
  ctx.lineTo(screenX, screenY + TILE_HEIGHT);
  ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fillStyle = c.fill;
  ctx.fill();

  const grad = ctx.createLinearGradient(screenX - 18, screenY + 2, screenX + 18, screenY + TILE_HEIGHT - 2);
  grad.addColorStop(0, c.accent);
  grad.addColorStop(1, c.fill);
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = hovered ? '#fbbf24' : c.line;
  ctx.lineWidth = hovered ? 1.7 : 1;
  ctx.stroke();
}

function drawRuinsPattern(
  ctx: CanvasRenderingContext2D,
  wallId: string,
  capOuter1: { x: number; y: number },
  capOuter2: { x: number; y: number },
  outer1: { x: number; y: number },
  outer2: { x: number; y: number },
  seed: number,
) {
  if (!wallId.startsWith('ruins-stone')) return;

  const width = Math.hypot(capOuter2.x - capOuter1.x, capOuter2.y - capOuter1.y);
  const height = Math.hypot(outer1.x - capOuter1.x, outer1.y - capOuter1.y);
  const isPlain = wallId.includes('plain');
  const isCracked = wallId.includes('cracked');
  const isMoss = wallId.includes('moss');
  const isEngraved = wallId.includes('engraved');
  const blocks = isPlain ? Math.max(3, Math.floor(width / 14)) : Math.max(5, Math.floor(width / 8));
  const rows = isPlain ? Math.max(3, Math.floor(height / 10)) : Math.max(4, Math.floor(height / 7));

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(capOuter1.x, capOuter1.y);
  ctx.lineTo(capOuter2.x, capOuter2.y);
  ctx.lineTo(outer2.x, outer2.y);
  ctx.lineTo(outer1.x, outer1.y);
  ctx.closePath();
  ctx.clip();

  // Horizontal courses
  ctx.strokeStyle = 'rgba(37, 29, 24, 0.5)';
  ctx.lineWidth = 1;
  for (let r = 1; r < rows; r++) {
    const t = r / rows;
    const n = (hash01(seed, 100 + r) - 0.5) * 0.015;
    const sx = capOuter1.x + (outer1.x - capOuter1.x) * t;
    const sy = capOuter1.y + (outer1.y - capOuter1.y) * t;
    const ex = capOuter2.x + (outer2.x - capOuter2.x) * (t + n);
    const ey = capOuter2.y + (outer2.y - capOuter2.y) * (t + n);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  // Vertical joints
  for (let c = 1; c < blocks; c++) {
    const t = c / blocks + (hash01(seed, 200 + c) - 0.5) * 0.025;
    const topX = capOuter1.x + (capOuter2.x - capOuter1.x) * t;
    const topY = capOuter1.y + (capOuter2.y - capOuter1.y) * t;
    const botX = outer1.x + (outer2.x - outer1.x) * t;
    const botY = outer1.y + (outer2.y - outer1.y) * t;
    const offset = (c % 2) * 3;
    ctx.strokeStyle = 'rgba(30, 24, 19, 0.45)';
    ctx.beginPath();
    ctx.moveTo(topX + offset * 0.2, topY + offset * 0.3);
    ctx.lineTo(botX - offset * 0.2, botY - offset * 0.3);
    ctx.stroke();
  }

  // Base weathering
  for (let i = 0; i < 12; i++) {
    const tx = hash01(seed, 300 + i);
    const ty = hash01(seed, 340 + i);
    const px = capOuter1.x + (capOuter2.x - capOuter1.x) * tx;
    const py = capOuter1.y + (outer1.y - capOuter1.y) * ty;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(25, 20, 17, 0.35)' : 'rgba(162, 136, 114, 0.2)';
    ctx.fillRect(px, py, 1, 1);
  }

  if (isPlain) {
    // Large ashlar stone faces with occasional joints
    ctx.strokeStyle = 'rgba(30, 24, 20, 0.4)';
    for (let i = 0; i < 3; i++) {
      const x = capOuter1.x + width * (0.2 + i * 0.25);
      ctx.beginPath();
      ctx.moveTo(x, capOuter1.y + 4 + (i % 2) * 3);
      ctx.lineTo(x + 2, outer1.y - 4);
      ctx.stroke();
    }
  }

  if (isCracked) {
    // Keep crack marks high-contrast so this variant reads differently from plain.
    ctx.strokeStyle = 'rgba(16, 12, 10, 0.86)';
    ctx.lineWidth = 1.4;
    const crackCount = Math.max(4, Math.floor(width / 18));
    for (let k = 0; k < crackCount; k++) {
      const t = 0.12 + (k / Math.max(1, crackCount - 1)) * 0.76;
      const startX = capOuter1.x + (capOuter2.x - capOuter1.x) * t;
      const startY = capOuter1.y + 4 + hash01(seed, 430 + k) * (height * 0.14);
      const mid1X = startX + (hash01(seed, 440 + k) - 0.5) * 8;
      const mid1Y = startY + height * (0.28 + hash01(seed, 450 + k) * 0.08);
      const mid2X = mid1X + (hash01(seed, 460 + k) - 0.5) * 8;
      const mid2Y = mid1Y + height * (0.2 + hash01(seed, 470 + k) * 0.12);
      const endX = mid2X + (hash01(seed, 480 + k) - 0.5) * 7;
      const endY = capOuter1.y + height * (0.86 + hash01(seed, 490 + k) * 0.08);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(mid1X, mid1Y);
      ctx.lineTo(mid2X, mid2Y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Small side branch to sell fractured stone look.
      ctx.beginPath();
      ctx.moveTo(mid1X, mid1Y);
      ctx.lineTo(mid1X + (hash01(seed, 500 + k) - 0.5) * 6, mid1Y + 4 + hash01(seed, 510 + k) * 5);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  }

  if (isMoss) {
    ctx.fillStyle = 'rgba(49, 91, 52, 0.55)';
    for (let i = 0; i < 6; i++) {
      const mx = capOuter1.x + width * (0.1 + i * 0.14);
      const my = capOuter1.y + 5 + ((i * 5) % 16);
      ctx.fillRect(mx, my, 5, 4);
    }
  }

  if (isEngraved) {
    ctx.strokeStyle = 'rgba(42, 30, 23, 0.55)';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 3; i++) {
      const cx = capOuter1.x + width * (0.24 + i * 0.26);
      const cy = capOuter1.y + height * (0.36 + (i % 2) * 0.14);
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy);
      ctx.lineTo(cx + 5, cy);
      ctx.moveTo(cx, cy - 5);
      ctx.lineTo(cx, cy + 5);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawWallItem(
  ctx: CanvasRenderingContext2D,
  item: WallItem,
  faceCenterX: number,
  faceCenterY: number,
  lineColor: string,
) {
  if (item === 'none') return;

  if (item === 'ivy') {
    ctx.strokeStyle = 'rgba(53, 122, 58, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(faceCenterX - 8, faceCenterY - 10);
    ctx.lineTo(faceCenterX - 4, faceCenterY - 2);
    ctx.lineTo(faceCenterX - 7, faceCenterY + 6);
    ctx.moveTo(faceCenterX + 1, faceCenterY - 8);
    ctx.lineTo(faceCenterX + 3, faceCenterY + 2);
    ctx.stroke();
    return;
  }

  if (item === 'crack') {
    ctx.strokeStyle = 'rgba(22, 18, 16, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(faceCenterX - 5, faceCenterY - 8);
    ctx.lineTo(faceCenterX + 1, faceCenterY - 2);
    ctx.lineTo(faceCenterX - 2, faceCenterY + 5);
    ctx.lineTo(faceCenterX + 4, faceCenterY + 10);
    ctx.stroke();
    return;
  }

  if (item === 'torch') {
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.fillStyle = '#5c432f';
    ctx.fillRect(faceCenterX - 1, faceCenterY - 6, 2, 10);
    ctx.beginPath();
    ctx.moveTo(faceCenterX, faceCenterY - 9);
    ctx.lineTo(faceCenterX - 3, faceCenterY - 4);
    ctx.lineTo(faceCenterX, faceCenterY - 2);
    ctx.lineTo(faceCenterX + 3, faceCenterY - 4);
    ctx.closePath();
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    return;
  }

  if (item === 'banner') {
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.fillStyle = '#6b1f1f';
    ctx.fillRect(faceCenterX - 1, faceCenterY - 10, 2, 12);
    ctx.beginPath();
    ctx.moveTo(faceCenterX + 1, faceCenterY - 8);
    ctx.lineTo(faceCenterX + 10, faceCenterY - 6);
    ctx.lineTo(faceCenterX + 10, faceCenterY + 3);
    ctx.lineTo(faceCenterX + 1, faceCenterY + 1);
    ctx.closePath();
    ctx.fill();
  }
}

function drawArchwayOnFace(
  ctx: CanvasRenderingContext2D,
  cap1: { x: number; y: number },
  cap2: { x: number; y: number },
  base1: { x: number; y: number },
  base2: { x: number; y: number },
  wide = false,
) {
  const faceWidth = Math.hypot(cap2.x - cap1.x, cap2.y - cap1.y);
  const faceHeight = Math.hypot(base1.x - cap1.x, base1.y - cap1.y);
  if (faceWidth < 8 || faceHeight < 10) return;

  const ux = (cap2.x - cap1.x) / faceWidth;
  const uy = (cap2.y - cap1.y) / faceWidth;
  const vx = (base1.x - cap1.x) / faceHeight;
  const vy = (base1.y - cap1.y) / faceHeight;
  const toPoint = (sx: number, sy: number) => ({
    x: cap1.x + ux * sx + vx * sy,
    y: cap1.y + uy * sx + vy * sy,
  });

  const baseY = faceHeight - 1;
  let springY = faceHeight * 0.58;
  let crownY = faceHeight * 0.11;
  const ring = Math.max(1.7, faceWidth * 0.055);

  const drawSingleArch = (cx: number, archHalf: number, stones: number) => {
    const leftBase = toPoint(cx - archHalf, baseY);
    const leftSpring = toPoint(cx - archHalf, springY);
    const rightSpring = toPoint(cx + archHalf, springY);
    const rightBase = toPoint(cx + archHalf, baseY);
    const crown = toPoint(cx, crownY);

    const leftBaseInner = toPoint(cx - archHalf + ring, baseY);
    const leftSpringInner = toPoint(cx - archHalf + ring, springY);
    const rightSpringInner = toPoint(cx + archHalf - ring, springY);
    const rightBaseInner = toPoint(cx + archHalf - ring, baseY);
    const crownInner = toPoint(cx, crownY + ring * 1.35);

    ctx.fillStyle = 'rgba(3, 3, 5, 0.98)';
    ctx.beginPath();
    ctx.moveTo(leftBaseInner.x, leftBaseInner.y);
    ctx.lineTo(leftSpringInner.x, leftSpringInner.y);
    ctx.quadraticCurveTo(crownInner.x, crownInner.y, rightSpringInner.x, rightSpringInner.y);
    ctx.lineTo(rightBaseInner.x, rightBaseInner.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(48, 44, 39, 0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftBase.x, leftBase.y);
    ctx.lineTo(leftSpring.x, leftSpring.y);
    ctx.quadraticCurveTo(crown.x, crown.y, rightSpring.x, rightSpring.y);
    ctx.lineTo(rightBase.x, rightBase.y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(189, 180, 168, 0.52)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftSpringInner.x, leftSpringInner.y);
    ctx.quadraticCurveTo(crownInner.x, crownInner.y, rightSpringInner.x, rightSpringInner.y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(34, 30, 26, 0.55)';
    ctx.lineWidth = 1;
    for (let i = 1; i < stones; i++) {
      const t = i / stones;
      const x = cx - archHalf + t * (archHalf * 2);
      const y = springY - Math.sin(t * Math.PI) * (springY - crownY);
      const p1 = toPoint(x - 0.25, y + 0.2);
      const p2 = toPoint(x + 0.25, y + ring * 1.2);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(126, 118, 108, 0.85)';
    const footW = ring * 1.7;
    const footH = ring * 1.25;
    const lf = toPoint(cx - archHalf - ring * 0.2, baseY - footH * 0.25);
    const rf = toPoint(cx + archHalf - footW + ring * 0.2, baseY - footH * 0.25);
    ctx.fillRect(lf.x, lf.y, footW, footH);
    ctx.fillRect(rf.x, rf.y, footW, footH);
  };

  if (wide) {
    // Multi-cell module: one arch starts on cell 1 and ends on cell 2.
    springY = faceHeight * 0.59;
    crownY = faceHeight * 0.085;
    const wideHalf = Math.min(faceWidth * 0.445, 18.5);
    drawSingleArch(faceWidth / 2, wideHalf, 12);
    return;
  }

  const singleHalf = Math.min(faceWidth * 0.43, 11.5);
  drawSingleArch(faceWidth / 2, singleHalf, 8);
}

function drawPillar(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, wallId: string) {
  const c = wallColors(wallId);
  const h = 42;
  const lift = worldLiftForScreenVertical(h);
  const w = 6;

  const baseL = { x: screenX - w, y: screenY + TILE_HEIGHT / 2 - 1 };
  const baseR = { x: screenX + w, y: screenY + TILE_HEIGHT / 2 + 1 };
  const topL = { x: baseL.x + lift.x, y: baseL.y + lift.y };
  const topR = { x: baseR.x + lift.x, y: baseR.y + lift.y };

  ctx.strokeStyle = c.line;
  ctx.fillStyle = c.left;
  ctx.beginPath();
  ctx.moveTo(topL.x, topL.y);
  ctx.lineTo(topR.x, topR.y);
  ctx.lineTo(baseR.x, baseR.y);
  ctx.lineTo(baseL.x, baseL.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = c.top;
  ctx.beginPath();
  ctx.moveTo(topL.x, topL.y);
  ctx.lineTo(topR.x, topR.y);
  ctx.lineTo(topR.x + 2, topR.y + 2);
  ctx.lineTo(topL.x + 2, topL.y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawWallSegment(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, wallId: string, edge: WallEdge, item: WallItem, seed: number) {
  const wall = WALL_MAP.get(wallId);
  const wallHeight = wall?.height ?? 38;
  const c = wallColors(wallId);
  const lift = worldLiftForScreenVertical(wallHeight);

  const A = { x: screenX, y: screenY };
  const B = { x: screenX + TILE_WIDTH / 2, y: screenY + TILE_HEIGHT / 2 };
  const D = { x: screenX - TILE_WIDTH / 2, y: screenY + TILE_HEIGHT / 2 };
  const outer1 = edge === 'right' ? A : D;
  const outer2 = edge === 'right' ? B : A;
  const shift = edge === 'right' ? { x: -TILE_WIDTH * 0.08, y: TILE_HEIGHT * 0.08 } : { x: TILE_WIDTH * 0.08, y: TILE_HEIGHT * 0.08 };
  const inner1 = { x: outer1.x + shift.x, y: outer1.y + shift.y };
  const inner2 = { x: outer2.x + shift.x, y: outer2.y + shift.y };

  const capOuter1 = { x: outer1.x + lift.x, y: outer1.y + lift.y };
  const capOuter2 = { x: outer2.x + lift.x, y: outer2.y + lift.y };
  const capInner1 = { x: inner1.x + lift.x, y: inner1.y + lift.y };
  const capInner2 = { x: inner2.x + lift.x, y: inner2.y + lift.y };

  ctx.strokeStyle = c.line;
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.moveTo(capOuter1.x, capOuter1.y);
  ctx.lineTo(capOuter2.x, capOuter2.y);
  ctx.lineTo(outer2.x, outer2.y);
  ctx.lineTo(outer1.x, outer1.y);
  ctx.closePath();
  ctx.fillStyle = edge === 'right' ? c.right : c.left;
  ctx.fill();
  ctx.stroke();

  drawRuinsPattern(ctx, wallId, capOuter1, capOuter2, outer1, outer2, seed);

  if (wallId.includes('archway') || wallId.includes('doorway')) {
    const isWideArch = wallId.includes('archway-wide');
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(capOuter1.x, capOuter1.y);
    ctx.lineTo(capOuter2.x, capOuter2.y);
    ctx.lineTo(outer2.x, outer2.y);
    ctx.lineTo(outer1.x, outer1.y);
    ctx.closePath();
    ctx.clip();
    drawArchwayOnFace(ctx, capOuter1, capOuter2, outer1, outer2, isWideArch);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.moveTo(capOuter1.x, capOuter1.y);
  ctx.lineTo(capOuter2.x, capOuter2.y);
  ctx.lineTo(capInner2.x, capInner2.y);
  ctx.lineTo(capInner1.x, capInner1.y);
  ctx.closePath();
  ctx.fillStyle = c.top;
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(capInner1.x, capInner1.y);
  ctx.lineTo(capInner2.x, capInner2.y);
  ctx.lineTo(inner2.x, inner2.y);
  ctx.lineTo(inner1.x, inner1.y);
  ctx.closePath();
  ctx.fillStyle = edge === 'right' ? c.left : c.right;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.stroke();

  // Reuse the same seed so front/back faces get matching crack/joint layout.
  drawRuinsPattern(ctx, wallId, capInner1, capInner2, inner1, inner2, seed);

  if (wallId.includes('archway') || wallId.includes('doorway')) {
    const isWideArch = wallId.includes('archway-wide');
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(capInner1.x, capInner1.y);
    ctx.lineTo(capInner2.x, capInner2.y);
    ctx.lineTo(inner2.x, inner2.y);
    ctx.lineTo(inner1.x, inner1.y);
    ctx.closePath();
    ctx.clip();
    drawArchwayOnFace(ctx, capInner1, capInner2, inner1, inner2, isWideArch);
    ctx.restore();
  }

  const faceCenterX = (capOuter1.x + capOuter2.x + outer1.x + outer2.x) / 4;
  const faceCenterY = (capOuter1.y + capOuter2.y + outer1.y + outer2.y) / 4;
  drawWallItem(ctx, item, faceCenterX, faceCenterY, c.line);
}

function cornerSegments(
  orientation: CornerOrientation,
): Array<{ edge: WallEdge; offset: { x: number; y: number } }> {
  if (orientation === 'east') {
    return [
      { edge: 'right', offset: { x: 0, y: 0 } },
      { edge: 'left', offset: { x: 1, y: 0 } },
    ];
  }
  if (orientation === 'south') {
    return [
      { edge: 'right', offset: { x: 0, y: 1 } },
      { edge: 'left', offset: { x: 1, y: 0 } },
    ];
  }
  if (orientation === 'west') {
    return [
      { edge: 'left', offset: { x: 0, y: 0 } },
      { edge: 'right', offset: { x: 0, y: 1 } },
    ];
  }
  return [
    { edge: 'right', offset: { x: -1, y: 0 } },
    { edge: 'left', offset: { x: 0, y: 0 } },
  ];
}

function paintWall(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, placement: LevelWallPlacement, tileKey: string) {
  const span = Math.max(1, placement.span || getWallSpan(placement.wallId));
  const item = placement.item || 'none';
  const seed = hashString(`${tileKey}:${placement.wallId}:${placement.shape}:${placement.edge}:${span}`);
  if (span > 1) {
    const step = wallSpanStep(placement.edge);
    const isDoubleArchModule = placement.wallId.includes('archway-wide');
    if (isDoubleArchModule) {
      const baseWallId = 'ruins-stone-plain';
      const wall = WALL_MAP.get(baseWallId);
      const wallHeight = wall?.height ?? 40;
      const c = wallColors(baseWallId);
      const lift = worldLiftForScreenVertical(wallHeight);

      const start = gridToScreen(0, 0);
      const end = gridToScreen(step.x * (span - 1), step.y * (span - 1));
      const startX = screenX + start.x;
      const startY = screenY + start.y;
      const endX = screenX + end.x;
      const endY = screenY + end.y;

      const A0 = { x: startX, y: startY };
      const Bn = { x: endX + TILE_WIDTH / 2, y: endY + TILE_HEIGHT / 2 };
      const Dn = { x: endX - TILE_WIDTH / 2, y: endY + TILE_HEIGHT / 2 };
      // For '\' edge multi-cell chains, the span runs from A(start) to D(last).
      const outer1 = placement.edge === 'right' ? A0 : Dn;
      const outer2 = placement.edge === 'right' ? Bn : A0;
      const shift = placement.edge === 'right' ? { x: -TILE_WIDTH * 0.08, y: TILE_HEIGHT * 0.08 } : { x: TILE_WIDTH * 0.08, y: TILE_HEIGHT * 0.08 };
      const inner1 = { x: outer1.x + shift.x, y: outer1.y + shift.y };
      const inner2 = { x: outer2.x + shift.x, y: outer2.y + shift.y };
      const capOuter1 = { x: outer1.x + lift.x, y: outer1.y + lift.y };
      const capOuter2 = { x: outer2.x + lift.x, y: outer2.y + lift.y };
      const capInner1 = { x: inner1.x + lift.x, y: inner1.y + lift.y };
      const capInner2 = { x: inner2.x + lift.x, y: inner2.y + lift.y };

      ctx.strokeStyle = c.line;
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.moveTo(capOuter1.x, capOuter1.y);
      ctx.lineTo(capOuter2.x, capOuter2.y);
      ctx.lineTo(outer2.x, outer2.y);
      ctx.lineTo(outer1.x, outer1.y);
      ctx.closePath();
      ctx.fillStyle = placement.edge === 'right' ? c.right : c.left;
      ctx.fill();
      ctx.stroke();
      drawRuinsPattern(ctx, baseWallId, capOuter1, capOuter2, outer1, outer2, seed + 311);

      ctx.beginPath();
      ctx.moveTo(capOuter1.x, capOuter1.y);
      ctx.lineTo(capOuter2.x, capOuter2.y);
      ctx.lineTo(capInner2.x, capInner2.y);
      ctx.lineTo(capInner1.x, capInner1.y);
      ctx.closePath();
      ctx.fillStyle = c.top;
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(capInner1.x, capInner1.y);
      ctx.lineTo(capInner2.x, capInner2.y);
      ctx.lineTo(inner2.x, inner2.y);
      ctx.lineTo(inner1.x, inner1.y);
      ctx.closePath();
      ctx.fillStyle = placement.edge === 'right' ? c.left : c.right;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();
      drawRuinsPattern(ctx, baseWallId, capInner1, capInner2, inner1, inner2, seed + 419);

      // Carve one continuous pass-through arch across both cells.
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(capOuter1.x, capOuter1.y);
      ctx.lineTo(capOuter2.x, capOuter2.y);
      ctx.lineTo(outer2.x, outer2.y);
      ctx.lineTo(outer1.x, outer1.y);
      ctx.closePath();
      ctx.clip();
      drawArchwayOnFace(ctx, capOuter1, capOuter2, outer1, outer2, true);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(capInner1.x, capInner1.y);
      ctx.lineTo(capInner2.x, capInner2.y);
      ctx.lineTo(inner2.x, inner2.y);
      ctx.lineTo(inner1.x, inner1.y);
      ctx.closePath();
      ctx.clip();
      drawArchwayOnFace(ctx, capInner1, capInner2, inner1, inner2, true);
      ctx.restore();
      return;
    }

    for (let i = 0; i < span; i++) {
      const segmentScreen = gridToScreen(step.x * i, step.y * i);
      const segmentWallId = placement.wallId;
      drawWallSegment(
        ctx,
        screenX + segmentScreen.x,
        screenY + segmentScreen.y,
        segmentWallId,
        placement.edge,
        'none',
        seed + 31 + i * 37,
      );
    }
    return;
  }
  if (placement.shape === 'pillar') {
    drawPillar(ctx, screenX, screenY, placement.wallId);
    return;
  }
  if (placement.shape === 'corner') {
    const segments = [...cornerSegments(placement.cornerOrientation || 'north')]
      .sort((a, b) => (a.offset.x + a.offset.y) - (b.offset.x + b.offset.y) || a.offset.x - b.offset.x);
    segments.forEach((segment, index) => {
      const segmentScreen = gridToScreen(segment.offset.x, segment.offset.y);
      drawWallSegment(
        ctx,
        screenX + segmentScreen.x,
        screenY + segmentScreen.y,
        placement.wallId,
        segment.edge,
        item,
        seed + 11 + index * 7,
      );
    });
    return;
  }
  if (placement.shape === 'cross') {
    drawWallSegment(ctx, screenX, screenY, placement.wallId, 'left', item, seed + 23);
    drawWallSegment(ctx, screenX, screenY, placement.wallId, 'right', item, seed + 29);
    drawPillar(ctx, screenX, screenY, placement.wallId);
    drawPillar(ctx, screenX + 8, screenY + 4, placement.wallId);
    return;
  }
  drawWallSegment(ctx, screenX, screenY, placement.wallId, placement.edge, item, seed + 31);
}

function paintDoor(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, edge: WallEdge, isOpen: boolean, isLocked: boolean) {
  const wallHeight = 36;
  if (isOpen) {
    ctx.fillStyle = 'rgba(93, 64, 55, 0.35)';
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(screenX + TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
    ctx.lineTo(screenX, screenY + TILE_HEIGHT);
    ctx.lineTo(screenX - TILE_WIDTH / 2, screenY + TILE_HEIGHT / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4a4a44';
    ctx.stroke();
    return;
  }

  drawWallSegment(ctx, screenX, screenY, 'ruins-archway', edge, 'none', 13);

  if (isLocked) {
    const lift = worldLiftForScreenVertical(wallHeight);
    const sign = edge === 'right' ? 1 : -1;
    ctx.fillStyle = '#eab308';
    ctx.fillRect(screenX + sign * 7 - 1, screenY + lift.y * 0.35 + 24, 3, 3);
  }
}

function interiorColors(id: string) {
  if (id === 'locker') return { main: '#596675', accent: '#8da0b2' };
  if (id === 'table') return { main: '#7b5a45', accent: '#af8a69' };
  if (id === 'crate') return { main: '#6d543f', accent: '#9d7958' };
  if (id === 'terminal') return { main: '#33505a', accent: '#54d38b' };
  if (id === 'generator') return { main: '#49515a', accent: '#9da7b2' };
  return { main: '#5b5b5b', accent: '#9a9a9a' };
}

function paintInterior(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  interior: LevelInteriorPlacement,
  interiorDef: InteriorDef | undefined,
) {
  const c = interiorColors(interior.interiorId);
  const top = screenY + TILE_HEIGHT / 2 - 16;
  const left = screenX - 11;

  ctx.fillStyle = c.main;
  ctx.strokeStyle = '#202020';
  ctx.lineWidth = 1;
  ctx.fillRect(left, top, 22, 16);
  ctx.strokeRect(left, top, 22, 16);

  ctx.fillStyle = c.accent;
  ctx.fillRect(left + 2, top + 2, 18, 3);

  ctx.fillStyle = '#121212';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText((interiorDef?.label || 'Prop').slice(0, 3).toUpperCase(), screenX, top + 12);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 9px monospace';
  ctx.fillText(String(interior.rotation), screenX, top - 3);
}

export function drawLevelScene(
  ctx: CanvasRenderingContext2D,
  data: LevelEditorData,
  hovered: { x: number; y: number } | null,
  zoom: number,
  ghost?: {
    layer: 'wall' | 'door' | 'interior';
    x: number;
    y: number;
    wallPlacement?: LevelWallPlacement;
    edge?: WallEdge;
    doorOpen?: boolean;
    doorLocked?: boolean;
    interior?: LevelInteriorPlacement;
  },
  cameraOffset: { x: number; y: number } = LEVEL_SCENE_ORIGIN,
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const bg = ctx.createRadialGradient(ctx.canvas.width * 0.15, 80, 60, ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.height);
  bg.addColorStop(0, '#1f1711');
  bg.addColorStop(0.45, '#090b10');
  bg.addColorStop(1, '#050608');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.save();
  ctx.translate(cameraOffset.x, cameraOffset.y);
  ctx.scale(zoom, zoom);
  ctx.transform(1, LEVEL_SCENE_CAMERA.skewY, LEVEL_SCENE_CAMERA.skewX, LEVEL_SCENE_CAMERA.scaleY, 0, 0);

  for (let y = 0; y < data.height; y++) {
    for (let x = 0; x < data.width; x++) {
      const key = `${x},${y}`;
      const screen = gridToScreen(x, y);
      paintTile(ctx, screen.x, screen.y, data.tiles[key] || DEFAULT_TILE_ID, hovered?.x === x && hovered?.y === y);
    }
  }

  const sortByIsoDepth = (a: string, b: string) => {
    const [ax, ay] = a.split(',').map(Number);
    const [bx, by] = b.split(',').map(Number);
    return (ax + ay) - (bx + by) || ax - bx;
  };

  Object.keys(data.walls).sort(sortByIsoDepth).forEach((key) => {
    const [x, y] = key.split(',').map(Number);
    const wall = data.walls[key];
    const screen = gridToScreen(x, y);
    paintWall(ctx, screen.x, screen.y, wall, key);
  });

  Object.keys(data.doors).sort(sortByIsoDepth).forEach((key) => {
    const [x, y] = key.split(',').map(Number);
    const door = data.doors[key];
    const screen = gridToScreen(x, y);
    paintDoor(ctx, screen.x, screen.y, door.edge, door.isOpen, door.isLocked);
  });

  Object.keys(data.interiors).sort(sortByIsoDepth).forEach((key) => {
    const [x, y] = key.split(',').map(Number);
    const interior = data.interiors[key];
    const screen = gridToScreen(x, y);
    paintInterior(ctx, screen.x, screen.y, interior, INTERIOR_MAP.get(interior.interiorId));
  });

  if (ghost) {
    const screen = gridToScreen(ghost.x, ghost.y);
    ctx.save();
    ctx.globalAlpha = 0.5;
    if (ghost.layer === 'wall' && ghost.wallPlacement) {
      paintWall(ctx, screen.x, screen.y, ghost.wallPlacement, 'ghost');
    }
    if (ghost.layer === 'door' && ghost.edge) {
      paintDoor(ctx, screen.x, screen.y, ghost.edge, !!ghost.doorOpen, !!ghost.doorLocked);
    }
    if (ghost.layer === 'interior' && ghost.interior) {
      paintInterior(ctx, screen.x, screen.y, ghost.interior, INTERIOR_MAP.get(ghost.interior.interiorId));
    }
    ctx.restore();
  }

  ctx.restore();
}

export function toSceneGrid(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  zoom: number,
  width: number,
  height: number,
  cameraOffset: { x: number; y: number } = LEVEL_SCENE_ORIGIN,
) {
  const rect = canvas.getBoundingClientRect();
  // Convert CSS pixel mouse coords into canvas pixel space first.
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const canvasX = (clientX - rect.left) * scaleX;
  const canvasY = (clientY - rect.top) * scaleY;
  const localX = (canvasX - cameraOffset.x) / zoom;
  const localY = (canvasY - cameraOffset.y) / zoom;
  const a = 1;
  const b = LEVEL_SCENE_CAMERA.skewY;
  const c = LEVEL_SCENE_CAMERA.skewX;
  const d = LEVEL_SCENE_CAMERA.scaleY;
  const det = a * d - b * c;
  const projX = (d * localX - c * localY) / det;
  const projY = (-b * localX + a * localY) / det;
  const grid = screenToGrid(projX, projY);
  if (grid.x < 0 || grid.y < 0 || grid.x >= width || grid.y >= height) return null;
  return grid;
}

import { FALLOUT2_TILE_TYPES } from '../../game/tileCatalog';
import type { Item } from '../../game/types';

export const LEVEL_STORAGE_KEY = 'ft2-dev-level-layout-v2';
export const CHARACTER_STORAGE_KEY = 'ft2-dev-character-v1';

export const DEFAULT_LEVEL_SIZE = 100;
export const MAX_LEVEL_SIZE = 200;
export const DEFAULT_TILE_ID = 'dirt-plain';

export type WallEdge = 'left' | 'right';
export type InteriorRotation = 0 | 90 | 180 | 270;
export type WallShape = 'straight' | 'corner' | 'cross' | 'pillar';
export type CornerOrientation = 'north' | 'east' | 'south' | 'west';
export type WallItem = 'none' | 'ivy' | 'crack' | 'torch' | 'banner';

export interface LevelWallPlacement {
  wallId: string;
  edge: WallEdge;
  shape: WallShape;
  cornerOrientation?: CornerOrientation;
  item: WallItem;
  span?: number;
}

export interface LevelDoorPlacement {
  edge: WallEdge;
  isOpen: boolean;
  isLocked: boolean;
}

export interface LevelInteriorPlacement {
  interiorId: string;
  rotation: InteriorRotation;
}

export interface InteriorDef {
  id: string;
  label: string;
  tags: string[];
}

export interface LevelEditorData {
  width: number;
  height: number;
  tiles: Record<string, string>;
  walls: Record<string, LevelWallPlacement>;
  doors: Record<string, LevelDoorPlacement>;
  interiors: Record<string, LevelInteriorPlacement>;
}

export const WALL_SHAPES: Array<{ id: WallShape; label: string }> = [
  { id: 'straight', label: 'Straight' },
  { id: 'corner', label: 'Corner' },
  { id: 'cross', label: 'Cross' },
  { id: 'pillar', label: 'Pillar' },
];

export const CORNER_ORIENTATIONS: Array<{ id: CornerOrientation; label: string }> = [
  { id: 'north', label: 'N' },
  { id: 'east', label: 'E' },
  { id: 'south', label: 'S' },
  { id: 'west', label: 'W' },
];

export const WALL_ITEMS: Array<{ id: WallItem; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'ivy', label: 'Ivy' },
  { id: 'crack', label: 'Crack' },
  { id: 'torch', label: 'Torch' },
  { id: 'banner', label: 'Banner' },
];

export interface CharacterEditorData {
  name: string;
  archetype: string;
  level: number;
  exp: number;
  nextLevelExp: number;
  hp: number;
  ap: number;
  ac: number;
  skillPoints: number;
  notes: string;
  itemIds: string[];
}

export const INTERIOR_CATALOG: InteriorDef[] = [
  { id: 'locker', label: 'Locker', tags: ['storage', 'metal'] },
  { id: 'table', label: 'Table', tags: ['furniture', 'surface'] },
  { id: 'crate', label: 'Crate', tags: ['storage', 'wood'] },
  { id: 'terminal', label: 'Terminal', tags: ['tech', 'console'] },
  { id: 'generator', label: 'Generator', tags: ['machine', 'power'] },
  { id: 'bedroll', label: 'Bedroll', tags: ['camp', 'sleep'] },
];

export const DEFAULT_LEVEL_DATA: LevelEditorData = {
  width: DEFAULT_LEVEL_SIZE,
  height: DEFAULT_LEVEL_SIZE,
  tiles: {},
  walls: {},
  doors: {},
  interiors: {},
};

export const DEFAULT_CHARACTER_DATA: CharacterEditorData = {
  name: 'Vault Dweller',
  archetype: 'survivor',
  level: 1,
  exp: 0,
  nextLevelExp: 1000,
  hp: 100,
  ap: 10,
  ac: 5,
  skillPoints: 0,
  notes: '',
  itemIds: ['10mm-pistol', 'stimpak'],
};

export const ENEMY_CATALOG = [
  { id: 'radroach', name: 'Radroach', hp: 40, ap: 8, ac: 2, expValue: 250, threat: 'Low' },
  { id: 'feral-ghoul', name: 'Feral Ghoul', hp: 60, ap: 8, ac: 3, expValue: 500, threat: 'Medium' },
  { id: 'raider', name: 'Raider', hp: 80, ap: 9, ac: 5, expValue: 750, threat: 'Medium' },
  { id: 'super-mutant', name: 'Super Mutant', hp: 120, ap: 6, ac: 10, expValue: 1500, threat: 'High' },
] as const;

export const ITEM_CATALOG: Item[] = [
  {
    id: '10mm-pistol',
    name: '10mm Pistol',
    description: 'A reliable semi-automatic handgun.',
    category: 'weapon',
    weight: 3,
    value: 250,
    damage: { min: 5, max: 12 },
    apCost: 5,
  },
  {
    id: 'hunting-rifle',
    name: 'Hunting Rifle',
    description: 'Long-range rifle with high single-shot damage.',
    category: 'weapon',
    weight: 8,
    value: 800,
    damage: { min: 16, max: 24 },
    apCost: 6,
  },
  {
    id: 'leather-armor',
    name: 'Leather Armor',
    description: 'Basic protection for wasteland fights.',
    category: 'armor',
    weight: 15,
    value: 700,
    acBonus: 10,
  },
  {
    id: 'metal-armor',
    name: 'Metal Armor',
    description: 'Heavy armor with stronger physical defense.',
    category: 'armor',
    weight: 26,
    value: 1500,
    acBonus: 16,
  },
  {
    id: 'stimpak',
    name: 'Stimpak',
    description: 'Restores HP instantly.',
    category: 'chem',
    weight: 0.1,
    value: 100,
    effect: 'heal:30',
    stackable: true,
    maxStack: 99,
  },
  {
    id: 'radaway',
    name: 'RadAway',
    description: 'Removes radiation over time.',
    category: 'chem',
    weight: 0.1,
    value: 200,
    effect: 'cleanse:radiation',
    stackable: true,
    maxStack: 99,
  },
  {
    id: 'water-chip',
    name: 'Water Chip',
    description: 'Critical quest objective component.',
    category: 'quest',
    weight: 1,
    value: 0,
  },
  {
    id: 'lockpick-set',
    name: 'Lockpick Set',
    description: 'Tool for opening locked doors and containers.',
    category: 'misc',
    weight: 1,
    value: 120,
  },
];

export const TILE_SUMMARY = {
  total: FALLOUT2_TILE_TYPES.length,
  families: Array.from(new Set(FALLOUT2_TILE_TYPES.map((tile) => tile.family))),
};

export function expToNextLevel(level: number): number {
  return 1000 + (level - 1) * 600;
}

export function levelMilestones(maxLevel: number): Array<{ level: number; requiredExp: number }> {
  const milestones: Array<{ level: number; requiredExp: number }> = [];
  let cumulativeExp = 0;
  for (let level = 1; level <= maxLevel; level++) {
    cumulativeExp += expToNextLevel(level);
    milestones.push({ level: level + 1, requiredExp: cumulativeExp });
  }
  return milestones;
}

export function itemById(id: string): Item | undefined {
  return ITEM_CATALOG.find((item) => item.id === id);
}

export function normalizeLevelData(raw: unknown): LevelEditorData {
  const parsed = (raw && typeof raw === 'object') ? (raw as Partial<LevelEditorData>) : {};
  const normalizedWalls: Record<string, LevelWallPlacement> = {};
  const rawWalls = parsed.walls && typeof parsed.walls === 'object' ? (parsed.walls as Record<string, unknown>) : {};
  for (const [key, value] of Object.entries(rawWalls)) {
    if (!value || typeof value !== 'object') continue;
    const candidate = value as Partial<LevelWallPlacement>;
    normalizedWalls[key] = {
      wallId: candidate.wallId || 'tin-wall-clean',
      edge: candidate.edge === 'left' ? 'left' : 'right',
      shape: candidate.shape === 'corner' || candidate.shape === 'cross' || candidate.shape === 'pillar' ? candidate.shape : 'straight',
      cornerOrientation: candidate.cornerOrientation === 'north' || candidate.cornerOrientation === 'east' || candidate.cornerOrientation === 'south' || candidate.cornerOrientation === 'west'
        ? candidate.cornerOrientation
        : 'north',
      item: candidate.item === 'ivy' || candidate.item === 'crack' || candidate.item === 'torch' || candidate.item === 'banner' ? candidate.item : 'none',
      span: typeof candidate.span === 'number' ? Math.max(1, Math.min(4, Math.round(candidate.span))) : getWallSpan(candidate.wallId || 'tin-wall-clean'),
    };
  }
  return {
    width: Math.max(6, Math.min(MAX_LEVEL_SIZE, Math.round(parsed.width || DEFAULT_LEVEL_DATA.width))),
    height: Math.max(6, Math.min(MAX_LEVEL_SIZE, Math.round(parsed.height || DEFAULT_LEVEL_DATA.height))),
    tiles: parsed.tiles && typeof parsed.tiles === 'object' ? parsed.tiles : {},
    walls: normalizedWalls,
    doors: parsed.doors && typeof parsed.doors === 'object' ? parsed.doors : {},
    interiors: parsed.interiors && typeof parsed.interiors === 'object' ? parsed.interiors : {},
  };
}

export function rotateInterior(rotation: InteriorRotation): InteriorRotation {
  if (rotation === 0) return 90;
  if (rotation === 90) return 180;
  if (rotation === 180) return 270;
  return 0;
}

export function getWallSpan(wallId: string): number {
  if (wallId.includes('archway-wide')) return 2;
  return 1;
}

export function wallSpanStep(edge: WallEdge): { x: number; y: number } {
  // Straight edge chains follow different grid axes.
  return edge === 'right' ? { x: 1, y: 0 } : { x: 0, y: 1 };
}

export function occupiedWallCells(x: number, y: number, placement: LevelWallPlacement): Array<{ x: number; y: number }> {
  if (placement.shape === 'corner') {
    const orientation = placement.cornerOrientation || 'north';
    const offsets = orientation === 'east'
      ? [{ x: 0, y: 0 }, { x: 1, y: 0 }]
      : orientation === 'south'
        ? [{ x: 0, y: 1 }, { x: 1, y: 0 }]
        : orientation === 'west'
          ? [{ x: 0, y: 1 }, { x: 0, y: 0 }]
          : [{ x: -1, y: 0 }, { x: 0, y: 0 }];
    return offsets.map((offset) => ({ x: x + offset.x, y: y + offset.y }));
  }

  const span = Math.max(1, placement.span || getWallSpan(placement.wallId));
  const step = wallSpanStep(placement.edge);
  const cells: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < span; i++) {
    cells.push({ x: x + step.x * i, y: y + step.y * i });
  }
  return cells;
}

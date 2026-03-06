export type WallFamily =
  | 'tin'
  | 'wood'
  | 'scrap'
  | 'concrete'
  | 'vault'
  | 'adobe'
  | 'ruins';

export interface WallTypeDef {
  id: string;
  family: WallFamily;
  label: string;
  height: number;
  notes?: string;
  tags: string[];
}

export const FALLOUT2_WALL_TYPES: WallTypeDef[] = [
  { id: 'tin-wall-clean', family: 'tin', label: 'Tin Wall (Clean)', height: 38, tags: ['tin', 'sheet', 'interior'] },
  { id: 'tin-wall-rust', family: 'tin', label: 'Tin Wall (Rust)', height: 38, tags: ['tin', 'sheet', 'rust'] },
  { id: 'tin-doorway', family: 'tin', label: 'Tin Doorway Frame', height: 38, tags: ['tin', 'doorway', 'frame'] },

  { id: 'wood-plank-wall', family: 'wood', label: 'Wood Plank Wall', height: 40, tags: ['wood', 'plank'] },
  { id: 'wood-board-wall', family: 'wood', label: 'Wood Board Wall', height: 40, tags: ['wood', 'board'] },
  { id: 'wood-shack-patch', family: 'wood', label: 'Shack Wall (Patched)', height: 42, tags: ['wood', 'patch', 'shack'] },

  { id: 'scrap-panel-dark', family: 'scrap', label: 'Scrap Panel (Dark)', height: 38, tags: ['scrap', 'metal'] },
  { id: 'scrap-panel-mixed', family: 'scrap', label: 'Scrap Panel (Mixed)', height: 42, tags: ['scrap', 'patchwork'] },
  { id: 'scrap-fence-heavy', family: 'scrap', label: 'Scrap Barrier (Heavy)', height: 46, tags: ['scrap', 'barrier'] },

  { id: 'concrete-plain', family: 'concrete', label: 'Concrete Wall', height: 42, tags: ['concrete', 'plain'] },
  { id: 'concrete-cracked', family: 'concrete', label: 'Concrete Wall (Cracked)', height: 42, tags: ['concrete', 'cracked'] },
  { id: 'concrete-rebar', family: 'concrete', label: 'Concrete Wall (Rebar)', height: 44, tags: ['concrete', 'rebar'] },

  { id: 'vault-steel-panel', family: 'vault', label: 'Vault Steel Panel', height: 44, tags: ['vault', 'steel', 'clean'] },
  { id: 'vault-ribbed-panel', family: 'vault', label: 'Vault Ribbed Panel', height: 44, tags: ['vault', 'steel', 'ribbed'] },
  { id: 'vault-bulkhead', family: 'vault', label: 'Vault Bulkhead Segment', height: 48, tags: ['vault', 'bulkhead'] },

  { id: 'adobe-plaster', family: 'adobe', label: 'Adobe Plaster Wall', height: 38, tags: ['adobe', 'plaster'] },
  { id: 'adobe-cracked', family: 'adobe', label: 'Adobe Wall (Cracked)', height: 38, tags: ['adobe', 'cracked'] },
  { id: 'adobe-reinforced', family: 'adobe', label: 'Adobe Wall (Reinforced)', height: 40, tags: ['adobe', 'reinforced'] },

  // Fallout-like masonry ruins set (base + variants)
  { id: 'ruins-stone-plain', family: 'ruins', label: 'Ruins Stone (Plain)', height: 40, tags: ['stone', 'ruins', 'masonry'] },
  { id: 'ruins-stone-cracked', family: 'ruins', label: 'Ruins Stone (Cracked)', height: 40, tags: ['stone', 'ruins', 'cracked'] },
  { id: 'ruins-stone-moss', family: 'ruins', label: 'Ruins Stone (Moss)', height: 40, tags: ['stone', 'ruins', 'moss'] },
  { id: 'ruins-stone-engraved', family: 'ruins', label: 'Ruins Stone (Engraved)', height: 40, tags: ['stone', 'ruins', 'engraved'] },
  { id: 'ruins-archway', family: 'ruins', label: 'Ruins Archway', height: 40, tags: ['stone', 'ruins', 'archway'] },
  { id: 'ruins-archway-wide', family: 'ruins', label: 'Ruins Archway (Double)', height: 40, tags: ['stone', 'ruins', 'archway', 'double'] },
];

export const WALL_FAMILY_ORDER: WallFamily[] = ['ruins', 'tin', 'wood', 'scrap', 'concrete', 'vault', 'adobe'];

export function getWallTypesByFamily(family: WallFamily): WallTypeDef[] {
  return FALLOUT2_WALL_TYPES.filter((wall) => wall.family === family);
}

export type TileFamily =
  | 'dirt'
  | 'metal'
  | 'stone'
  | 'cement'
  | 'wood'
  | 'roof'
  | 'grate'
  | 'industrial'
  | 'road'
  | 'cave';

export interface TileTypeDef {
  id: string;
  family: TileFamily;
  label: string;
  notes?: string;
  tags: string[];
}

// Extracted as a taxonomy from the Fallout 2 mapper tile catalog image (visual + label family inference).
// This is a "types" catalog, not raw tile sprite extraction.
export const FALLOUT2_TILE_TYPES: TileTypeDef[] = [
  { id: 'dirt-plain', family: 'dirt', label: 'Dirt Plain', tags: ['ground', 'natural', 'base'] },
  { id: 'dirt-rocky', family: 'dirt', label: 'Dirt Rocky', tags: ['ground', 'natural', 'pebbles'] },
  { id: 'dirt-sandy', family: 'dirt', label: 'Dirt Sandy', tags: ['ground', 'natural', 'sand'] },
  { id: 'dirt-packed', family: 'dirt', label: 'Dirt Packed', tags: ['ground', 'natural', 'packed'] },
  { id: 'dirt-rough', family: 'dirt', label: 'Dirt Rough', tags: ['ground', 'natural', 'rough'] },

  { id: 'metal-panel-clean', family: 'metal', label: 'Metal Panel (Clean)', tags: ['industrial', 'panel', 'clean'] },
  { id: 'metal-panel-worn', family: 'metal', label: 'Metal Panel (Worn)', tags: ['industrial', 'panel', 'worn'] },
  { id: 'metal-riveted', family: 'metal', label: 'Metal Riveted Plate', tags: ['industrial', 'rivets'] },
  { id: 'metal-rust', family: 'metal', label: 'Metal Rusted', tags: ['industrial', 'rust'] },
  { id: 'metal-plate-grid', family: 'metal', label: 'Metal Plate Grid', tags: ['industrial', 'grid'] },

  { id: 'grate-dark', family: 'grate', label: 'Grate Dark', tags: ['industrial', 'grate', 'floor'] },
  { id: 'grate-light', family: 'grate', label: 'Grate Light', tags: ['industrial', 'grate', 'floor'] },
  { id: 'grate-striped', family: 'grate', label: 'Grate Striped', tags: ['industrial', 'grate', 'warning'] },

  { id: 'roof-corrugated-clean', family: 'roof', label: 'Corrugated Roof (Clean)', tags: ['corrugated', 'roof', 'sheet'] },
  { id: 'roof-corrugated-rust', family: 'roof', label: 'Corrugated Roof (Rust)', tags: ['corrugated', 'roof', 'rust'] },
  { id: 'roof-corrugated-patch', family: 'roof', label: 'Corrugated Roof (Patched)', tags: ['corrugated', 'roof', 'patchwork'] },

  { id: 'stone-cave-rough', family: 'cave', label: 'Cave Stone Rough', tags: ['stone', 'cave', 'natural'] },
  { id: 'stone-cave-pebble', family: 'cave', label: 'Cave Stone Pebble', tags: ['stone', 'cave', 'pebbled'] },
  { id: 'stone-cave-cracked', family: 'cave', label: 'Cave Stone Cracked', tags: ['stone', 'cave', 'cracked'] },

  { id: 'stone-slab', family: 'stone', label: 'Stone Slab', tags: ['stone', 'slab'] },
  { id: 'stone-curb', family: 'stone', label: 'Stone Curb', tags: ['stone', 'curb', 'edge'] },
  { id: 'stone-curb-striped', family: 'stone', label: 'Stone Curb (Striped)', tags: ['stone', 'curb', 'stripe'] },
  { id: 'stone-panel', family: 'stone', label: 'Stone Panel', tags: ['stone', 'panel'] },
  { id: 'stone-etched', family: 'stone', label: 'Stone Etched', tags: ['stone', 'engraved'] },

  { id: 'road-dark', family: 'road', label: 'Road Dark', tags: ['road', 'asphalt', 'dark'] },
  { id: 'road-striped', family: 'road', label: 'Road Striped', tags: ['road', 'lane-lines'] },
  { id: 'road-cracked', family: 'road', label: 'Road Cracked', tags: ['road', 'cracked'] },

  { id: 'cement-dark', family: 'cement', label: 'Cement Dark', tags: ['cement', 'urban', 'floor'] },
  { id: 'cement-cracked', family: 'cement', label: 'Cement Cracked', tags: ['cement', 'urban', 'cracked'] },
  { id: 'cement-dirty', family: 'cement', label: 'Cement Dirty', tags: ['cement', 'urban', 'dirt'] },
  { id: 'cement-striped', family: 'cement', label: 'Cement Striped', tags: ['cement', 'warning', 'stripe'] },
  { id: 'cement-debris', family: 'cement', label: 'Cement Debris', tags: ['cement', 'debris'] },

  { id: 'industrial-plate', family: 'industrial', label: 'Industrial Plate', tags: ['industrial', 'plate'] },
  { id: 'industrial-panel-lines', family: 'industrial', label: 'Industrial Panel Lines', tags: ['industrial', 'panel', 'linework'] },
  { id: 'industrial-machined', family: 'industrial', label: 'Industrial Machined Floor', tags: ['industrial', 'machined'] },

  { id: 'wood-plank-floor', family: 'wood', label: 'Wood Plank Floor', tags: ['wood', 'plank', 'floor'] },
  { id: 'wood-board-floor', family: 'wood', label: 'Wood Board Floor', tags: ['wood', 'board', 'floor'] },
];

export const TILE_FAMILY_ORDER: TileFamily[] = [
  'dirt',
  'metal',
  'grate',
  'roof',
  'cave',
  'stone',
  'road',
  'cement',
  'industrial',
  'wood',
];

export function getTileTypesByFamily(family: TileFamily): TileTypeDef[] {
  return FALLOUT2_TILE_TYPES.filter((tile) => tile.family === family);
}


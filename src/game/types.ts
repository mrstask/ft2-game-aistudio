export interface Point {
  x: number;
  y: number;
}

export type ItemCategory = 'weapon' | 'armor' | 'chem' | 'quest' | 'misc';

export interface Item {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  weight: number;
  value: number;
  icon?: string;
  // Stacking
  stackable?: boolean;
  maxStack?: number;
  quantity?: number;
  // Category specific stats
  damage?: { min: number; max: number };
  acBonus?: number;
  apCost?: number;
  effect?: string; // e.g. "heal:20", "buff:str:2"
}

export interface Equipment {
  weapon?: Item;
  armor?: Item;
}

export interface Inventory {
  items: Item[];
  maxWeight: number;
}

export interface Entity {
  id: string;
  type: 'player' | 'enemy' | 'npc';
  subType?: string;
  spriteUrl?: string;
  gridX: number;
  gridY: number;
  hp: number;
  maxHp: number;
  ap: number;
  maxAp: number;
  ac: number; // Armor Class
  name: string;
  detectionRange?: number;
  facing?: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
  isMoving?: boolean;
  inventory?: Inventory;
  equipment?: Equipment;
  // Leveling system
  level?: number;
  exp?: number;
  nextLevelExp?: number;
  skillPoints?: number;
  expValue?: number; // XP awarded for defeating this entity
  movementType?: 'bipedal' | 'quadrupedal' | 'mechanized' | 'crawling';
  size?: 'small' | 'medium' | 'large' | 'colossal';
  basePrompt?: string;
}

export interface VisualEffect {
  id: string;
  type: 'impact' | 'miss';
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

export interface MapObject {
  id: string;
  type: 'door';
  gridX: number;
  gridY: number;
  isOpen: boolean;
  isLocked: boolean;
  name: string;
}

export interface ContextMenuState {
  x: number;
  y: number;
  objectId?: string;
  entityId?: string;
}

export interface WorldItem {
  id: string;
  gridX: number;
  gridY: number;
  item: Item;
}

export interface GameState {
  entities: Entity[];
  turn: 'player' | 'enemy';
  mode: 'wander' | 'combat';
  logs: string[];
  selectedTile: Point | null;
  hoveredTile: Point | null;
  path: Point[];
  walls: string[]; // Array of "x,y" strings
  effects: VisualEffect[];
  shakeIntensity: number;
  objects: MapObject[];
  worldItems: WorldItem[];
  contextMenu: ContextMenuState | null;
  isInventoryOpen: boolean;
  quickSlots: (Item | null)[];
  isLevelUpOpen: boolean;
  devMode: boolean;
  isSpriteEditorOpen: boolean;
}

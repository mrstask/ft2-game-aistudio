export interface Point {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  type: 'player' | 'enemy' | 'npc';
  gridX: number;
  gridY: number;
  hp: number;
  maxHp: number;
  ap: number;
  maxAp: number;
  ac: number; // Armor Class
  name: string;
  detectionRange?: number;
}

export interface GameState {
  entities: Entity[];
  turn: 'player' | 'enemy';
  mode: 'wander' | 'combat';
  logs: string[];
  selectedTile: Point | null;
  path: Point[];
}

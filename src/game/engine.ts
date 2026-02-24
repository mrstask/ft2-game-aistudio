import { TILE_WIDTH, TILE_HEIGHT } from './constants';
import { Point } from './types';

/**
 * Converts grid coordinates to screen coordinates (Isometric)
 */
export function gridToScreen(gridX: number, gridY: number): Point {
  return {
    x: (gridX - gridY) * (TILE_WIDTH / 2),
    y: (gridX + gridY) * (TILE_HEIGHT / 2),
  };
}

/**
 * Converts screen coordinates to grid coordinates (Isometric)
 */
export function screenToGrid(screenX: number, screenY: number): Point {
  const x = (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2;
  const y = (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2;
  return { x: Math.floor(x), y: Math.floor(y) };
}

/**
 * BFS pathfinding that respects obstacles
 */
export function getPath(start: Point, end: Point, obstacles: Set<string>, gridSize: number = 20): Point[] {
  if (start.x === end.x && start.y === end.y) return [];
  
  const queue: { pos: Point, path: Point[] }[] = [{ pos: start, path: [] }];
  const visited = new Set<string>([`${start.x},${start.y}`]);
  
  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    
    // Check neighbors (4-way movement)
    const neighbors = [
      { x: pos.x + 1, y: pos.y },
      { x: pos.x - 1, y: pos.y },
      { x: pos.x, y: pos.y + 1 },
      { x: pos.x, y: pos.y - 1 },
    ];
    
    for (const next of neighbors) {
      const key = `${next.x},${next.y}`;
      
      if (next.x === end.x && next.y === end.y) {
        return [...path, next];
      }
      
      if (
        next.x >= 0 && next.x < gridSize &&
        next.y >= 0 && next.y < gridSize &&
        !obstacles.has(key) &&
        !visited.has(key)
      ) {
        visited.add(key);
        queue.push({ pos: next, path: [...path, next] });
      }
    }
  }
  
  return []; // No path found
}

/**
 * Calculates the percentage chance to hit a target
 */
export function calculateHitChance(attackerAp: number, targetAc: number, baseChance: number = 60): number {
  return Math.max(5, Math.min(95, baseChance + (attackerAp * 2) - (targetAc * 2)));
}

/**
 * Calculates random damage within a range
 */
export function calculateDamage(min: number = 5, max: number = 15): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

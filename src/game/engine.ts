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
 * Simple A* or BFS would go here. For now, a simple Manhattan distance path.
 */
export function getPath(start: Point, end: Point): Point[] {
  const path: Point[] = [];
  let currX = start.x;
  let currY = start.y;

  while (currX !== end.x || currY !== end.y) {
    if (currX < end.x) currX++;
    else if (currX > end.x) currX--;
    else if (currY < end.y) currY++;
    else if (currY > end.y) currY--;
    path.push({ x: currX, y: currY });
  }
  return path;
}

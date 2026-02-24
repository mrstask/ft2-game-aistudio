import { describe, it, expect } from 'vitest';
import { gridToScreen, screenToGrid, getPath, calculateHitChance, calculateDamage } from './engine';
import { TILE_WIDTH, TILE_HEIGHT } from './constants';

describe('Game Engine', () => {
  describe('Coordinate Conversion', () => {
    it('should convert grid coordinates to screen coordinates correctly', () => {
      // (0,0) should be (0,0)
      expect(gridToScreen(0, 0)).toEqual({ x: 0, y: 0 });
      
      // (1,0) should be (TILE_WIDTH/2, TILE_HEIGHT/2)
      expect(gridToScreen(1, 0)).toEqual({ x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 });
      
      // (0,1) should be (-TILE_WIDTH/2, TILE_HEIGHT/2)
      expect(gridToScreen(0, 1)).toEqual({ x: -TILE_WIDTH / 2, y: TILE_HEIGHT / 2 });
    });

    it('should convert screen coordinates back to grid coordinates correctly', () => {
      const grid = { x: 5, y: 3 };
      const screen = gridToScreen(grid.x, grid.y);
      const convertedBack = screenToGrid(screen.x, screen.y);
      
      expect(convertedBack).toEqual(grid);
    });
  });

  describe('Pathfinding', () => {
    it('should generate a simple path between two points', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 2, y: 1 };
      const path = getPath(start, end, new Set());
      
      // Path should have 3 steps: (1,0), (2,0), (2,1)
      expect(path).toHaveLength(3);
      expect(path[0]).toEqual({ x: 1, y: 0 });
      expect(path[1]).toEqual({ x: 2, y: 0 });
      expect(path[2]).toEqual({ x: 2, y: 1 });
    });

    it('should avoid obstacles', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 2, y: 0 };
      const obstacles = new Set(['1,0']);
      const path = getPath(start, end, obstacles);
      
      // Should go around: (0,1), (1,1), (2,1), (2,0)
      expect(path).toHaveLength(4);
      expect(path.some(p => p.x === 1 && p.y === 0)).toBe(false);
    });

    it('should return an empty path if start and end are the same', () => {
      const point = { x: 5, y: 5 };
      const path = getPath(point, point, new Set());
      expect(path).toHaveLength(0);
    });

    it('should return an empty path if target is unreachable', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 2, y: 0 };
      const obstacles = new Set(['1,0', '0,1']); // Blocked
      const path = getPath(start, end, obstacles);
      expect(path).toHaveLength(0);
    });
  });

  describe('Combat Logic', () => {
    it('should calculate hit chance correctly', () => {
      // Base 60, AP 10, AC 5 -> 60 + 20 - 10 = 70
      expect(calculateHitChance(10, 5)).toBe(70);
      
      // Caps at 95
      expect(calculateHitChance(50, 0)).toBe(95);
      
      // Floors at 5
      expect(calculateHitChance(0, 50)).toBe(5);
    });

    it('should calculate damage within range', () => {
      for (let i = 0; i < 100; i++) {
        const damage = calculateDamage(5, 15);
        expect(damage).toBeGreaterThanOrEqual(5);
        expect(damage).toBeLessThanOrEqual(15);
      }
    });
  });
});

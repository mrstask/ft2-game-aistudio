import React, { useRef, useEffect, useState } from 'react';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE, COLORS } from '../game/constants';
import { gridToScreen, screenToGrid, getPath } from '../game/engine';
import { Entity, Point, GameState } from '../game/types';

interface GameCanvasProps {
  gameState: GameState;
  onTileClick: (point: Point) => void;
  onHover: (point: Point | null) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onTileClick, onHover }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 400, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);

    // Draw Grid
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const screen = gridToScreen(x, y);
        
        // Tile highlight
        if (gameState.selectedTile?.x === x && gameState.selectedTile?.y === y) {
          ctx.fillStyle = COLORS.HIGHLIGHT;
        } else {
          ctx.fillStyle = 'transparent';
        }

        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y);
        ctx.lineTo(screen.x + TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2);
        ctx.lineTo(screen.x, screen.y + TILE_HEIGHT);
        ctx.lineTo(screen.x - TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2);
        ctx.closePath();
        
        ctx.strokeStyle = COLORS.GRID;
        ctx.stroke();
        if (ctx.fillStyle !== 'transparent') ctx.fill();
      }
    }

    // Draw Path
    if (gameState.path.length > 0) {
      ctx.fillStyle = COLORS.PATH;
      gameState.path.forEach(p => {
        const screen = gridToScreen(p.x, p.y);
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y);
        ctx.lineTo(screen.x + TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2);
        ctx.lineTo(screen.x, screen.y + TILE_HEIGHT);
        ctx.lineTo(screen.x - TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2);
        ctx.closePath();
        ctx.fill();
      });
    }

    // Draw Entities
    gameState.entities.forEach(entity => {
      const screen = gridToScreen(entity.gridX, entity.gridY);
      const isPlayer = entity.type === 'player';
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = isPlayer ? COLORS.PLAYER : COLORS.ENEMY;
      ctx.fillStyle = isPlayer ? COLORS.PLAYER : COLORS.ENEMY;
      
      // Character body
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y + TILE_HEIGHT / 2, 8, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Character head
      ctx.beginPath();
      ctx.arc(screen.x, screen.y + TILE_HEIGHT / 2 - 18, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;

      // HP Bar
      const hpWidth = 40;
      const hpPercent = entity.hp / entity.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(screen.x - hpWidth / 2, screen.y - 25, hpWidth, 4);
      ctx.fillStyle = hpPercent > 0.5 ? '#4ade80' : hpPercent > 0.2 ? '#facc15' : '#ef4444';
      ctx.fillRect(screen.x - hpWidth / 2, screen.y - 25, hpWidth * hpPercent, 4);
      
      // Name tag
      ctx.fillStyle = 'white';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(entity.name, screen.x, screen.y - 30);
    });

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const render = () => {
      draw(ctx);
      animationFrameId = window.requestAnimationFrame(render);
    };
    render();

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [gameState, offset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left - offset.x;
        const y = e.clientY - rect.top - offset.y;
        const grid = screenToGrid(x, y);
        if (grid.x >= 0 && grid.x < GRID_SIZE && grid.y >= 0 && grid.y < GRID_SIZE) {
          onHover(grid);
        } else {
          onHover(null);
        }
      }
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left - offset.x;
      const y = e.clientY - rect.top - offset.y;
      const grid = screenToGrid(x, y);
      if (grid.x >= 0 && grid.x < GRID_SIZE && grid.y >= 0 && grid.y < GRID_SIZE) {
        onTileClick(grid);
      }
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="bg-[#1a1a1a] cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
      />
    </div>
  );
};

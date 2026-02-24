import React, { useRef, useEffect, useState } from 'react';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE, COLORS } from '../game/constants';
import { gridToScreen, screenToGrid, getPath } from '../game/engine';
import { Entity, Point, GameState } from '../game/types';

interface GameCanvasProps {
  gameState: GameState;
  onTileClick: (point: Point, screenX: number, screenY: number) => void;
  onHover: (point: Point | null) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onTileClick, onHover }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 400, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const visualPositions = useRef<Map<string, { x: number, y: number }>>(new Map());
  
  // Use refs for animation loop to avoid restarting it on every state change
  const gameStateRef = useRef(gameState);
  const offsetRef = useRef(offset);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 20;
      switch (e.key) {
        case 'ArrowUp':
          setOffset(prev => ({ ...prev, y: prev.y + step }));
          break;
        case 'ArrowDown':
          setOffset(prev => ({ ...prev, y: prev.y - step }));
          break;
        case 'ArrowLeft':
          setOffset(prev => ({ ...prev, x: prev.x + step }));
          break;
        case 'ArrowRight':
          setOffset(prev => ({ ...prev, x: prev.x - step }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const draw = (ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    const currentOffset = offsetRef.current;
    
    // Ensure we clear the entire canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    ctx.save();
    try {
      // Apply Screen Shake
      if (state.shakeIntensity > 0) {
        const sx = (Math.random() - 0.5) * state.shakeIntensity;
        const sy = (Math.random() - 0.5) * state.shakeIntensity;
        ctx.translate(sx, sy);
      }

      ctx.translate(currentOffset.x, currentOffset.y);

      // Draw Grid
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          const screen = gridToScreen(x, y);
          
          // Tile highlight
          if (state.selectedTile?.x === x && state.selectedTile?.y === y) {
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

          // Draw Wall if present
          if (state.walls.includes(`${x},${y}`)) {
            ctx.fillStyle = '#1a1a1a';
            ctx.strokeStyle = '#4a4a44';
            ctx.lineWidth = 2;
            
            const wallHeight = 20;
            
            ctx.beginPath();
            ctx.moveTo(screen.x, screen.y - wallHeight);
            ctx.lineTo(screen.x + TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2 - wallHeight);
            ctx.lineTo(screen.x, screen.y + TILE_HEIGHT - wallHeight);
            ctx.lineTo(screen.x - TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2 - wallHeight);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#121210';
            ctx.beginPath();
            ctx.moveTo(screen.x - TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2 - wallHeight);
            ctx.lineTo(screen.x, screen.y + TILE_HEIGHT - wallHeight);
            ctx.lineTo(screen.x, screen.y + TILE_HEIGHT);
            ctx.lineTo(screen.x - TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#0a0a08';
            ctx.beginPath();
            ctx.moveTo(screen.x + TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2 - wallHeight);
            ctx.lineTo(screen.x, screen.y + TILE_HEIGHT - wallHeight);
            ctx.lineTo(screen.x, screen.y + TILE_HEIGHT);
            ctx.lineTo(screen.x + TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.lineWidth = 1;
          }
        }
      }

      // Draw Objects (Doors)
      state.objects.forEach(obj => {
        if (obj.type === 'door') {
          const screen = gridToScreen(obj.gridX, obj.gridY);
          const wallHeight = 20;
          
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#4a4a44';
          
          if (!obj.isOpen) {
            // Closed Door - Draw a brown block
            ctx.fillStyle = '#5d4037';
            
            // Top face
            ctx.beginPath();
            ctx.moveTo(screen.x, screen.y - wallHeight);
            ctx.lineTo(screen.x + TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2 - wallHeight);
            ctx.lineTo(screen.x, screen.y + TILE_HEIGHT - wallHeight);
            ctx.lineTo(screen.x - TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2 - wallHeight);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Left face
            ctx.fillStyle = '#4e342e';
            ctx.beginPath();
            ctx.moveTo(screen.x - TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2 - wallHeight);
            ctx.lineTo(screen.x, screen.y + TILE_HEIGHT - wallHeight);
            ctx.lineTo(screen.x, screen.y + TILE_HEIGHT);
            ctx.lineTo(screen.x - TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Right face
            ctx.fillStyle = '#3e2723';
            ctx.beginPath();
            ctx.moveTo(screen.x + TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2 - wallHeight);
            ctx.lineTo(screen.x, screen.y + TILE_HEIGHT - wallHeight);
            ctx.lineTo(screen.x, screen.y + TILE_HEIGHT);
            ctx.lineTo(screen.x + TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else {
            // Open Door - Draw a frame or just a flat tile with a small indicator
            ctx.fillStyle = 'rgba(93, 64, 55, 0.3)';
            ctx.beginPath();
            ctx.moveTo(screen.x, screen.y);
            ctx.lineTo(screen.x + TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2);
            ctx.lineTo(screen.x, screen.y + TILE_HEIGHT);
            ctx.lineTo(screen.x - TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Draw a small "open" indicator
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(screen.x - 2, screen.y + TILE_HEIGHT / 2 - 10, 4, 10);
          }
          
          ctx.lineWidth = 1;
        }
      });

      // Draw World Items
      state.worldItems.forEach(worldItem => {
        const screen = gridToScreen(worldItem.gridX, worldItem.gridY);
        const time = Date.now() / 1000;
        const float = Math.sin(time * 3) * 2;

        ctx.save();
        ctx.translate(screen.x, screen.y + TILE_HEIGHT / 2 + float);
        
        // Draw a small glowing loot bag or box
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#4ade80';
        ctx.fillStyle = '#4ade80';
        
        // Simple diamond shape for item
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(-6, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      });

      // Draw Path
      if (state.path.length > 0) {
        const player = state.entities.find(e => e.id === 'player')!;
        const isCombat = state.mode === 'combat';
        const canAfford = !isCombat || state.path.length <= player.ap;
        
        ctx.fillStyle = canAfford ? COLORS.PATH : 'rgba(239, 68, 68, 0.4)';
        
        state.path.forEach(p => {
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
      state.entities.forEach(entity => {
        let pos = visualPositions.current.get(entity.id);
        if (!pos) {
          pos = { x: entity.gridX, y: entity.gridY };
          visualPositions.current.set(entity.id, pos);
        }

        const moveSpeed = 0.15;
        const dx = entity.gridX - pos.x;
        const dy = entity.gridY - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > moveSpeed) {
          pos.x += (dx / dist) * moveSpeed;
          pos.y += (dy / dist) * moveSpeed;
        } else {
          pos.x = entity.gridX;
          pos.y = entity.gridY;
        }

        const screen = gridToScreen(pos.x, pos.y);
        const isPlayer = entity.type === 'player';
        const time = Date.now() / 1000;
        
        // Animation values
        const bob = entity.isMoving ? Math.sin(time * 15) * 3 : Math.sin(time * 2) * 1;
        const sway = entity.isMoving ? Math.cos(time * 15) * 2 : 0;
        
        ctx.save();
        ctx.translate(screen.x + sway, screen.y + TILE_HEIGHT / 2 + bob);
        
        // Flip based on facing
        const facing = entity.facing || 's';
        const isLeft = ['e', 'ne', 'se'].includes(facing);
        const isBack = ['n', 'ne', 'nw'].includes(facing);
        
        if (isLeft) ctx.scale(-1, 1);

        if (isPlayer) {
          // Vault Suit (Blue)
          ctx.fillStyle = '#1e3a8a'; // Dark blue
          
          // Legs
          ctx.fillRect(-6, 0, 4, 12);
          ctx.fillRect(2, 0, 4, 12);
          
          // Torso
          ctx.fillRect(-7, -15, 14, 16);
          
          // Yellow Detail (Belt or Number)
          ctx.fillStyle = '#facc15';
          if (isBack) {
            // Back detail (the "13" or similar)
            ctx.fillRect(-2, -12, 4, 6);
          } else {
            // Front detail (Belt)
            ctx.fillRect(-7, -5, 14, 3);
          }
          
          // Arms
          ctx.fillStyle = '#1e3a8a';
          const armAngle = entity.isMoving ? Math.sin(time * 15) * 0.5 : 0.2;
          ctx.save();
          ctx.rotate(armAngle);
          ctx.fillRect(6, -14, 4, 12); // Right arm
          ctx.restore();
          
          ctx.save();
          ctx.rotate(-armAngle);
          ctx.fillRect(-10, -14, 4, 12); // Left arm
          ctx.restore();

          // Head
          ctx.fillStyle = '#fde68a'; // Skin tone
          ctx.beginPath();
          ctx.arc(0, -22, 6, 0, Math.PI * 2);
          ctx.fill();
          
          if (!isBack) {
            // Eyes
            ctx.fillStyle = '#111827';
            ctx.fillRect(1, -23, 2, 2);
            ctx.fillRect(4, -23, 2, 2);
          }
          
          // Hair/Helmet (Black)
          ctx.fillStyle = '#111827';
          if (isBack) {
            // Back hair covers more
            ctx.beginPath();
            ctx.arc(0, -22, 6, -Math.PI * 0.2, Math.PI * 1.2);
            ctx.fill();
          } else {
            // Front hair (Fringe)
            ctx.beginPath();
            ctx.arc(0, -24, 6, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-6, -24, 12, 4);
          }
          
        } else {
          // Enemy (Red/Brown)
          ctx.fillStyle = entity.name === 'Super Mutant' ? '#4d7c0f' : '#b91c1c';
          
          // Body
          ctx.beginPath();
          ctx.ellipse(0, -5, 10, 18, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Head
          ctx.beginPath();
          ctx.arc(0, -25, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // HP Bar and Name Tag
        const hpWidth = 40;
        const hpPercent = entity.hp / entity.maxHp;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(screen.x - hpWidth / 2, screen.y - 35, hpWidth, 4);
        ctx.fillStyle = hpPercent > 0.5 ? '#4ade80' : hpPercent > 0.2 ? '#facc15' : '#ef4444';
        ctx.fillRect(screen.x - hpWidth / 2, screen.y - 35, hpWidth * hpPercent, 4);
        
        ctx.fillStyle = 'white';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(entity.name, screen.x, screen.y - 40);
      });

      // Draw Visual Effects
      state.effects.forEach(effect => {
        const screen = gridToScreen(effect.x, effect.y);
        const elapsed = Date.now() - effect.startTime;
        const progress = Math.min(1, Math.max(0, elapsed / effect.duration));
        
        if (effect.type === 'impact') {
          ctx.fillStyle = '#ef4444';
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dist = progress * 30;
            const px = screen.x + Math.cos(angle) * dist;
            const py = screen.y + TILE_HEIGHT / 2 + Math.sin(angle) * dist;
            const size = (1 - progress) * 4;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (effect.type === 'miss') {
          ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`;
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('MISS', screen.x, screen.y - 40 - progress * 20);
        }
      });
    } finally {
      ctx.restore();
    }
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
    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, []); // Only run once

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
  
  const getCursor = () => {
    if (isDragging) return 'grabbing';
    if (!gameState.selectedTile) return 'default';
    
    const isEnemy = gameState.entities.some(e => 
      e.gridX === gameState.selectedTile?.x && 
      e.gridY === gameState.selectedTile?.y && 
      e.type === 'enemy'
    );

    if (isEnemy) {
      return 'crosshair';
    }

    if (gameState.mode === 'wander') {
      return 'context-menu'; // Context menu arrow feel
    }

    return 'pointer'; // Walk cursor
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const x = screenX - offset.x;
      const y = screenY - offset.y;
      const grid = screenToGrid(x, y);
      if (grid.x >= 0 && grid.x < GRID_SIZE && grid.y >= 0 && grid.y < GRID_SIZE) {
        onTileClick(grid, screenX, screenY);
      }
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ cursor: getCursor() }}
        className="bg-[#1a1a1a]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
      />
    </div>
  );
};

import React, { useRef, useEffect, useState } from 'react';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE, COLORS } from '../game/constants';
import { gridToScreen, screenToGrid, getPath } from '../game/engine';
import { getDirectionalSpriteCell, getPlayerPose } from '../game/animation';
import { Entity, Point, GameState } from '../game/types';

interface GameCanvasProps {
  gameState: GameState;
  onTileClick: (point: Point, screenX: number, screenY: number) => void;
  onTileContextMenu: (point: Point, screenX: number, screenY: number) => void;
  onHover: (point: Point | null) => void;
  selectedEntityId: string | null;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onTileClick, onTileContextMenu, onHover, selectedEntityId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 400, y: 50 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const visualPositions = useRef<Map<string, { x: number, y: number }>>(new Map());
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  
  // Use refs for animation loop to avoid restarting it on every state change
  const gameStateRef = useRef(gameState);
  const offsetRef = useRef(offset);
  const zoomRef = useRef(zoom);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

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
      ctx.scale(zoomRef.current, zoomRef.current);

      // Draw Detection Range for hovered or selected enemy
      const hoveredEnemy = state.hoveredTile ? state.entities.find(e => e.gridX === state.hoveredTile?.x && e.gridY === state.hoveredTile?.y && e.type === 'enemy') : null;
      const selectedEnemy = selectedEntityId ? state.entities.find(e => e.id === selectedEntityId && e.type === 'enemy') : null;
      const enemyToHighlight = hoveredEnemy || selectedEnemy;

      if (enemyToHighlight && enemyToHighlight.detectionRange) {
        const range = enemyToHighlight.detectionRange;
        ctx.save();
        
        // Draw a diamond shape representing the Manhattan distance range
        for (let dx = -range; dx <= range; dx++) {
          for (let dy = -range; dy <= range; dy++) {
            if (Math.abs(dx) + Math.abs(dy) <= range) {
              const tx = enemyToHighlight.gridX + dx;
              const ty = enemyToHighlight.gridY + dy;
              
              if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
                const screen = gridToScreen(tx, ty);
                ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; // Reddish semi-transparent
                ctx.beginPath();
                ctx.moveTo(screen.x, screen.y);
                ctx.lineTo(screen.x + TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2);
                ctx.lineTo(screen.x, screen.y + TILE_HEIGHT);
                ctx.lineTo(screen.x - TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2);
                ctx.closePath();
                ctx.fill();
                
                // Add a subtle border to the range edge
                if (Math.abs(dx) + Math.abs(dy) === range) {
                  ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
                  ctx.lineWidth = 1;
                  ctx.stroke();
                }
              }
            }
          }
        }
        ctx.restore();
      }

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
        
        const playerPose = isPlayer ? getPlayerPose(entity, time) : null;
        const bob = playerPose?.bob ?? (entity.isMoving ? Math.sin(time * 15) * 3 : Math.sin(time * 2) * 1);
        const sway = playerPose?.sway ?? (entity.isMoving ? Math.cos(time * 15) * 2 : 0);
        
        ctx.save();
        ctx.translate(screen.x + sway, screen.y + TILE_HEIGHT / 2 + bob);
        
        const facing = entity.facing || 's';

        if (entity.spriteUrl) {
          let img = imageCache.current.get(entity.spriteUrl);
          if (!img) {
            img = new Image();
            img.src = entity.spriteUrl;
            imageCache.current.set(entity.spriteUrl, img);
          }

          if (img.complete) {
            const { col, row } = getDirectionalSpriteCell(facing);

            const baseSize = 48;
            const sizeScale = 
              entity.size === 'small' ? 0.7 :
              entity.size === 'large' ? 1.5 :
              entity.size === 'colossal' ? 2.5 : 1.0;
            
            const size = baseSize * sizeScale;
            
            // Source dimensions (assuming 2x2 grid)
            const sw = img.width / 2;
            const sh = img.height / 2;
            const sx = col * sw;
            const sy = row * sh;

            ctx.drawImage(img, sx, sy, sw, sh, -size / 2, -size, size, size);
            
            // Draw HP bar above sprite
            ctx.restore();
            ctx.save();
            ctx.translate(screen.x, screen.y - size + bob);
            
            const hpWidth = 30;
            const hpHeight = 3;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(-hpWidth / 2, -10, hpWidth, hpHeight);
            ctx.fillStyle = isPlayer ? '#4ade80' : '#ef4444';
            ctx.fillRect(-hpWidth / 2, -10, hpWidth * (entity.hp / entity.maxHp), hpHeight);
            
            ctx.restore();
            return;
          }
        }

        // Flip based on facing for geometric figures
        const isLeft = ['e', 'ne', 'se'].includes(facing);
        const isBack = ['n', 'ne', 'nw'].includes(facing);
        if (isLeft) ctx.scale(-1, 1);

        if (isPlayer) {
          const pose = playerPose || getPlayerPose(entity, time);
          ctx.rotate(pose.torsoTilt);
          ctx.scale(pose.bodyScaleX, 1);
          const armorDark = '#4a4f53';
          const armorMid = '#7a8086';
          const armorLight = '#b4bcc1';
          const armorJoint = '#2a2f34';
          const visorGlow = '#b8f85f';
          
          // Legs
          const leftLegY = 0 + Math.max(0, pose.leftLegLift);
          const rightLegY = 0 + Math.max(0, pose.rightLegLift);
          const leftLegHeight = 12 + Math.max(0, pose.rightLegLift) * 0.5;
          const rightLegHeight = 12 + Math.max(0, pose.leftLegLift) * 0.5;
          ctx.fillStyle = armorJoint;
          ctx.fillRect(-7 - pose.hipOffsetX, leftLegY + 1, 5 * pose.strideCompressX, leftLegHeight);
          ctx.fillRect(2 + pose.hipOffsetX, rightLegY + 1, 5 * pose.strideCompressX, rightLegHeight);
          ctx.fillStyle = armorMid;
          ctx.fillRect(-7 - pose.hipOffsetX, leftLegY, 5 * pose.strideCompressX, 6);
          ctx.fillRect(2 + pose.hipOffsetX, rightLegY, 5 * pose.strideCompressX, 6);
          ctx.fillStyle = armorLight;
          ctx.fillRect(-6 - pose.hipOffsetX, leftLegY + leftLegHeight - 4, 3 * pose.strideCompressX, 4);
          ctx.fillRect(3 + pose.hipOffsetX, rightLegY + rightLegHeight - 4, 3 * pose.strideCompressX, 4);

          // Hip / codpiece block
          ctx.fillStyle = armorDark;
          ctx.fillRect(-6, -2 + pose.torsoLeanY, 12, 6);
          ctx.fillStyle = armorLight;
          ctx.fillRect(-2, -1 + pose.torsoLeanY, 4, 3);
          
          // Torso core
          ctx.fillStyle = armorMid;
          ctx.fillRect(-8 - pose.shoulderOffsetX, -17 + pose.torsoLeanY, 16 + pose.shoulderOffsetX * 2, 18);
          ctx.fillStyle = armorDark;
          ctx.fillRect(-5, -14 + pose.torsoLeanY, 10, 11);
          ctx.fillStyle = armorLight;
          ctx.fillRect(-7, -16 + pose.torsoLeanY, 14, 3);
          ctx.fillRect(-7, -1 + pose.torsoLeanY, 14, 2);
          
          // Chest details
          if (isBack) {
            ctx.fillStyle = armorJoint;
            ctx.fillRect(-4, -12 + pose.torsoLeanY, 8, 7);
            ctx.fillStyle = '#6ee7b7';
            ctx.fillRect(-1, -9 + pose.torsoLeanY, 2, 2);
          } else {
            ctx.fillStyle = armorJoint;
            ctx.fillRect(-5, -12 + pose.torsoLeanY, 10, 6);
            ctx.fillStyle = '#d4af37';
            ctx.fillRect(-1, -10 + pose.torsoLeanY, 2, 2);
            ctx.fillStyle = '#f97316';
            ctx.fillRect(-4, -7 + pose.torsoLeanY, 2, 1);
            ctx.fillRect(2, -7 + pose.torsoLeanY, 2, 1);
          }

          // Shoulder pauldrons
          ctx.fillStyle = armorMid;
          ctx.beginPath();
          ctx.ellipse(-9 - pose.shoulderOffsetX, -13 + pose.torsoLeanY, 5, 4, -0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(9 + pose.shoulderOffsetX, -13 + pose.torsoLeanY, 5, 4, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = armorLight;
          ctx.fillRect(-12 - pose.shoulderOffsetX, -15 + pose.torsoLeanY, 4, 2);
          ctx.fillRect(8 + pose.shoulderOffsetX, -15 + pose.torsoLeanY, 4, 2);
          
          // Arms
          ctx.save();
          ctx.rotate(pose.rightArmAngle);
          ctx.fillStyle = armorJoint;
          ctx.fillRect(7 + pose.shoulderOffsetX, -12 + pose.torsoLeanY, 4, 12); // Right arm
          ctx.fillStyle = armorMid;
          ctx.fillRect(6 + pose.shoulderOffsetX, -14 + pose.torsoLeanY, 5, 6);
          ctx.fillStyle = armorLight;
          ctx.fillRect(7 + pose.shoulderOffsetX, -3 + pose.torsoLeanY, 4, 2);
          ctx.restore();
          
          ctx.save();
          ctx.rotate(pose.leftArmAngle);
          ctx.fillStyle = armorJoint;
          ctx.fillRect(-11 - pose.shoulderOffsetX, -12 + pose.torsoLeanY, 4, 12); // Left arm
          ctx.fillStyle = armorMid;
          ctx.fillRect(-11 - pose.shoulderOffsetX, -14 + pose.torsoLeanY, 5, 6);
          ctx.fillStyle = armorLight;
          ctx.fillRect(-11 - pose.shoulderOffsetX, -3 + pose.torsoLeanY, 4, 2);
          ctx.restore();

          // Helmet / head
          const hx = pose.headOffsetX;
          const hy = -23 + pose.headOffsetY + pose.torsoLeanY;
          ctx.fillStyle = armorDark;
          ctx.beginPath();
          ctx.ellipse(hx, hy, 7, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = armorMid;
          ctx.beginPath();
          ctx.ellipse(hx, hy - 1, 6, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = armorLight;
          ctx.fillRect(hx - 4, hy - 6, 6, 2);
          ctx.fillRect(hx - 6, hy - 1, 2, 3);
          if (isBack) {
            ctx.fillStyle = armorJoint;
            ctx.fillRect(hx - 4, hy, 8, 4);
            ctx.fillStyle = '#16a34a';
            ctx.fillRect(hx - 1, hy + 1, 2, 1);
          } else {
            ctx.fillStyle = armorJoint;
            ctx.fillRect(hx - 4, hy - 1, 8, 3);
            ctx.fillStyle = visorGlow;
            ctx.fillRect(hx + 1, hy - 1, 3, 1);
            if (!isLeft) {
              ctx.fillRect(hx + 3, hy - 2, 1, 1);
            }
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

    // Long press logic for context menu
    if (e.button === 0) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const x = (screenX - offset.x) / zoom;
        const y = (screenY - offset.y) / zoom;
        const grid = screenToGrid(x, y);
        
        longPressTimer.current = setTimeout(() => {
          if (!isDragging) {
            onTileContextMenu(grid, e.clientX, e.clientY);
          }
        }, 500);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isDragging) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - offset.x) / zoom;
        const y = (e.clientY - rect.top - offset.y) / zoom;
        const grid = screenToGrid(x, y);
        if (grid.x >= 0 && grid.x < GRID_SIZE && grid.y >= 0 && grid.y < GRID_SIZE) {
          onHover(grid);
        } else {
          onHover(null);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  
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
      const x = (screenX - offset.x) / zoom;
      const y = (screenY - offset.y) / zoom;
      const grid = screenToGrid(x, y);
      if (grid.x >= 0 && grid.x < GRID_SIZE && grid.y >= 0 && grid.y < GRID_SIZE) {
        onTileClick(grid, screenX, screenY);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const x = (screenX - offset.x) / zoom;
      const y = (screenY - offset.y) / zoom;
      const grid = screenToGrid(x, y);
      if (grid.x >= 0 && grid.x < GRID_SIZE && grid.y >= 0 && grid.y < GRID_SIZE) {
        onTileContextMenu(grid, e.clientX, e.clientY);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomStep = 0.1;
    const newZoom = e.deltaY < 0 
      ? Math.min(2, zoom + zoomStep) 
      : Math.max(0.5, zoom - zoomStep);
    
    // Optional: Zoom towards mouse position
    // For now, simple zoom is fine
    setZoom(newZoom);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative">
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
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
      />
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <button 
          onClick={() => setZoom(prev => Math.min(2, prev + 0.2))}
          className="w-10 h-10 bg-[#1a1a1a] border-2 border-[#4a4a44] text-[#4ade80] font-bold hover:bg-[#4a4a44] transition-colors shadow-lg flex items-center justify-center"
          title="Zoom In"
        >
          +
        </button>
        <button 
          onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
          className="w-10 h-10 bg-[#1a1a1a] border-2 border-[#4a4a44] text-[#4ade80] font-bold hover:bg-[#4a4a44] transition-colors shadow-lg flex items-center justify-center"
          title="Zoom Out"
        >
          -
        </button>
        <button 
          onClick={() => {
            setZoom(1);
            setOffset({ x: canvasSize.width / 2, y: 50 });
          }}
          className="w-10 h-10 bg-[#1a1a1a] border-2 border-[#4a4a44] text-[#4ade80] text-[10px] font-bold hover:bg-[#4a4a44] transition-colors shadow-lg flex items-center justify-center"
          title="Reset View"
        >
          RST
        </button>
      </div>
      
      {/* Zoom Indicator */}
      <div className="absolute bottom-4 right-4 text-[#4ade80]/30 font-mono text-[10px] pointer-events-none">
        ZOOM: {(zoom * 100).toFixed(0)}%
      </div>
    </div>
  );
};

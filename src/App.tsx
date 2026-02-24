import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { FalloutHUD } from './components/FalloutHUD';
import { ContextMenu } from './components/ContextMenu';
import { Inventory } from './components/Inventory';
import { Entity, GameState, Point, MapObject, Item, WorldItem } from './game/types';
import { getPath, calculateHitChance, calculateDamage } from './game/engine';

const INITIAL_ENTITIES: Entity[] = [
  {
    id: 'player',
    type: 'player',
    gridX: 2,
    gridY: 2,
    hp: 100,
    maxHp: 100,
    ap: 10,
    maxAp: 10,
    ac: 5,
    name: 'Vault Dweller',
    facing: 's',
  },
  {
    id: 'enemy-1',
    type: 'enemy',
    gridX: 12,
    gridY: 12,
    hp: 40,
    maxHp: 40,
    ap: 8,
    maxAp: 8,
    ac: 2,
    name: 'Radroach',
    detectionRange: 5,
  },
  {
    id: 'enemy-2',
    type: 'enemy',
    gridX: 18,
    gridY: 4,
    hp: 60,
    maxHp: 60,
    ap: 8,
    maxAp: 8,
    ac: 3,
    name: 'Feral Ghoul',
    detectionRange: 6,
  },
  {
    id: 'enemy-3',
    type: 'enemy',
    gridX: 5,
    gridY: 18,
    hp: 120,
    maxHp: 120,
    ap: 6,
    maxAp: 6,
    ac: 10,
    name: 'Super Mutant',
    detectionRange: 4,
  },
];

const INITIAL_WALLS = [
  '4,4', '4,5', '4,6', '5,4', '6,4',
  '10,10', '10,11', '10,12', '11,10', '12,10',
  '15,5', '15,6', '15,7', '16,5', '17,5',
  // Building walls
  '7,7', '7,8', '7,9', '7,10', '7,11',
  '8,7', '9,7', '11,7', '12,7',
  '12,8', '12,9', '12,10', '12,11',
  '8,11', '9,11', '10,11', '11,11'
];

const INITIAL_OBJECTS: MapObject[] = [
  {
    id: 'door-1',
    type: 'door',
    gridX: 10,
    gridY: 7,
    isOpen: false,
    isLocked: true,
    name: 'Wooden Door',
  }
];

const SAMPLE_ITEMS: Item[] = [
  {
    id: '10mm-pistol',
    name: '10mm Pistol',
    description: 'A reliable semi-automatic handgun.',
    category: 'weapon',
    weight: 3,
    value: 250,
    damage: { min: 5, max: 12 },
    apCost: 5,
  },
  {
    id: 'leather-armor',
    name: 'Leather Armor',
    description: 'Tough cured leather provides basic protection.',
    category: 'armor',
    weight: 15,
    value: 700,
    acBonus: 10,
  },
  {
    id: 'stimpak',
    name: 'Stimpak',
    description: 'A healing syringe that restores HP.',
    category: 'chem',
    weight: 0.1,
    value: 100,
    effect: 'heal:30',
  },
  {
    id: 'water-chip',
    name: 'Water Chip',
    description: 'A critical component for a Vault water purification system.',
    category: 'quest',
    weight: 1,
    value: 0,
  }
];

const INITIAL_WORLD_ITEMS: WorldItem[] = [
  {
    id: 'world-item-1',
    gridX: 5,
    gridY: 5,
    item: SAMPLE_ITEMS[0],
  },
  {
    id: 'world-item-2',
    gridX: 8,
    gridY: 8,
    item: SAMPLE_ITEMS[2],
  }
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    entities: INITIAL_ENTITIES.map(e => e.id === 'player' ? {
      ...e,
      inventory: { items: [SAMPLE_ITEMS[2]], maxWeight: 150 },
      equipment: {}
    } : e),
    turn: 'player',
    mode: 'wander',
    logs: ['Welcome to the Wasteland.', 'Wander mode active.', 'Use Arrow Keys or Alt+Drag to move the camera.'],
    selectedTile: null,
    path: [],
    walls: INITIAL_WALLS,
    effects: [],
    shakeIntensity: 0,
    objects: INITIAL_OBJECTS,
    worldItems: INITIAL_WORLD_ITEMS,
    contextMenu: null,
    isInventoryOpen: false,
  });
  const [walkingPath, setWalkingPath] = useState<Point[]>([]);

  const player = gameState.entities.find(e => e.id === 'player')!;
  const obstacles: Set<string> = new Set([
    ...gameState.walls,
    ...gameState.objects
      .filter(obj => obj.type === 'door' && !obj.isOpen)
      .map(obj => `${obj.gridX},${obj.gridY}`)
  ]);

  const addLog = (msg: string) => {
    setGameState(prev => ({
      ...prev,
      logs: [msg, ...prev.logs].slice(0, 50),
    }));
  };

  const triggerEffect = (type: 'impact' | 'miss', x: number, y: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    setGameState(prev => ({
      ...prev,
      effects: [...prev.effects, { id, type, x, y, startTime: Date.now(), duration: 500 }],
      shakeIntensity: type === 'impact' ? 10 : 3,
    }));

    // Cleanup effect
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        effects: prev.effects.filter(e => e.id !== id),
      }));
    }, 500);
  };

  // Decay shake intensity
  useEffect(() => {
    if (gameState.shakeIntensity > 0) {
      const timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          shakeIntensity: Math.max(0, prev.shakeIntensity - 1),
        }));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [gameState.shakeIntensity]);

  // Process walking path
  useEffect(() => {
    if (walkingPath.length > 0) {
      const timer = setTimeout(() => {
        const nextTile = walkingPath[0];
        setGameState(prev => {
          const player = prev.entities.find(e => e.id === 'player')!;
          
          // Determine facing
          let facing = player.facing || 's';
          const dx = nextTile.x - player.gridX;
          const dy = nextTile.y - player.gridY;
          
          if (dx > 0 && dy === 0) facing = 'se';
          else if (dx < 0 && dy === 0) facing = 'nw';
          else if (dx === 0 && dy > 0) facing = 'sw';
          else if (dx === 0 && dy < 0) facing = 'ne';
          else if (dx > 0 && dy > 0) facing = 's';
          else if (dx < 0 && dy < 0) facing = 'n';
          else if (dx > 0 && dy < 0) facing = 'e';
          else if (dx < 0 && dy > 0) facing = 'w';

          return {
            ...prev,
            entities: prev.entities.map(e => 
              e.id === 'player' ? { ...e, gridX: nextTile.x, gridY: nextTile.y, facing, isMoving: true } : e
            ),
          };
        });
        setWalkingPath(prev => prev.slice(1));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      // Set isMoving to false when path is finished
      setGameState(prev => ({
        ...prev,
        entities: prev.entities.map(e => 
          e.id === 'player' ? { ...e, isMoving: false } : e
        ),
      }));
    }
  }, [walkingPath]);

  const startCombat = useCallback(() => {
    setGameState(prev => {
      if (prev.mode === 'combat') return prev;
      return {
        ...prev,
        mode: 'combat',
        turn: 'player',
        logs: ['Combat initiated!', ...prev.logs].slice(0, 50),
      };
    });
    setWalkingPath([]); // Stop walking when combat starts
  }, []);

  const handleTileClick = (point: Point, screenX: number, screenY: number) => {
    if (walkingPath.length > 0) return; // Ignore clicks while walking

    // Check if clicking a world item
    const worldItem = gameState.worldItems.find(wi => wi.gridX === point.x && wi.gridY === point.y);
    if (worldItem) {
      // Check distance
      const dist = Math.sqrt(Math.pow(player.gridX - point.x, 2) + Math.pow(player.gridY - point.y, 2));
      if (dist <= 1.5) {
        setGameState(prev => {
          const newPlayer = { ...player };
          if (!newPlayer.inventory) newPlayer.inventory = { items: [], maxWeight: 150 };
          
          // Check weight
          const currentWeight = newPlayer.inventory.items.reduce((sum, i) => sum + i.weight, 0);
          if (currentWeight + worldItem.item.weight > newPlayer.inventory.maxWeight) {
            addLog("Too heavy to pick up.");
            return prev;
          }

          newPlayer.inventory.items = [...newPlayer.inventory.items, worldItem.item];
          addLog(`Picked up ${worldItem.item.name}.`);
          
          return {
            ...prev,
            entities: prev.entities.map(e => e.id === 'player' ? newPlayer : e),
            worldItems: prev.worldItems.filter(wi => wi.id !== worldItem.id)
          };
        });
        return;
      } else {
        addLog("Too far away to pick up.");
      }
    }

    // Check if clicking a door
    const door = gameState.objects.find(obj => obj.gridX === point.x && obj.gridY === point.y && obj.type === 'door');
    if (door) {
      setGameState(prev => ({
        ...prev,
        contextMenu: { x: screenX, y: screenY, objectId: door.id }
      }));
      return;
    }

    // Close context menu if clicking elsewhere
    if (gameState.contextMenu) {
      setGameState(prev => ({ ...prev, contextMenu: null }));
    }

    // Check if clicking an enemy
    const enemy = gameState.entities.find(e => e.gridX === point.x && e.gridY === point.y && e.type === 'enemy');
    
    if (enemy) {
      if (gameState.mode === 'wander') {
        startCombat();
        return;
      }

      if (gameState.turn !== 'player') return;

      // Combat logic
      const dist = Math.abs(player.gridX - enemy.gridX) + Math.abs(player.gridY - enemy.gridY);
      const weapon = player.equipment?.weapon;
      const apCost = weapon?.apCost || 4;
      const damageRange = weapon?.damage || { min: 1, max: 3 };

      if (dist <= 1) {
        if (player.ap >= apCost) {
          const toHit = calculateHitChance(player.ap, enemy.ac);
          const roll = Math.floor(Math.random() * 100);
          
          if (roll <= toHit) {
            const damage = calculateDamage(damageRange.min, damageRange.max);
            addLog(`You hit ${enemy.name} for ${damage} damage!`);
            triggerEffect('impact', enemy.gridX, enemy.gridY);
            
            setGameState(prev => {
              const nextEntities = prev.entities.map(e => {
                if (e.id === 'player') return { ...e, ap: e.ap - apCost };
                if (e.id === enemy.id) return { ...e, hp: Math.max(0, e.hp - damage) };
                return e;
              }).filter(e => e.hp > 0);

              // Check if combat should end
              const enemiesLeft = nextEntities.some(e => e.type === 'enemy');
              return {
                ...prev,
                entities: nextEntities,
                mode: enemiesLeft ? 'combat' : 'wander',
                logs: enemiesLeft ? prev.logs : ['All hostiles eliminated. Wander mode active.', ...prev.logs].slice(0, 50),
              };
            });
          } else {
            addLog(`You missed ${enemy.name}!`);
            triggerEffect('miss', enemy.gridX, enemy.gridY);
            setGameState(prev => ({
              ...prev,
              entities: prev.entities.map(e => e.id === 'player' ? { ...e, ap: e.ap - 4 } : e)
            }));
          }
        } else {
          addLog('Not enough AP to attack!');
        }
      } else {
        addLog('Too far to attack!');
      }
      return;
    }

    // Movement logic
    const path = getPath({ x: player.gridX, y: player.gridY }, point, obstacles);
    
    if (gameState.mode === 'wander') {
      if (path.length > 0) {
        const nextTile = path[0];
        setGameState(prev => {
          const player = prev.entities.find(e => e.id === 'player')!;
          let facing = player.facing || 's';
          const dx = nextTile.x - player.gridX;
          const dy = nextTile.y - player.gridY;
          
          if (dx > 0 && dy === 0) facing = 'se';
          else if (dx < 0 && dy === 0) facing = 'nw';
          else if (dx === 0 && dy > 0) facing = 'sw';
          else if (dx === 0 && dy < 0) facing = 'ne';
          else if (dx > 0 && dy > 0) facing = 's';
          else if (dx < 0 && dy < 0) facing = 'n';
          else if (dx > 0 && dy < 0) facing = 'e';
          else if (dx < 0 && dy > 0) facing = 'w';

          return {
            ...prev,
            entities: prev.entities.map(e => 
              e.id === 'player' ? { ...e, facing, isMoving: true } : e
            ),
          };
        });
      }
      setWalkingPath(path);
    } else {
      if (gameState.turn !== 'player') return;
      const apCost = path.length;
      if (apCost <= player.ap) {
        setGameState(prev => ({
          ...prev,
          entities: prev.entities.map(e => 
            e.id === 'player' ? { ...e, ap: e.ap - apCost } : e
          ),
          path: [],
        }));
        setWalkingPath(path);
      } else {
        addLog('Not enough AP to move that far!');
      }
    }
  };

  const handleHover = (point: Point | null) => {
    if (!point) {
      setGameState(prev => ({ ...prev, selectedTile: null, path: [] }));
      return;
    }

    const path = getPath({ x: player.gridX, y: player.gridY }, point, obstacles);
    setGameState(prev => ({ ...prev, selectedTile: point, path }));
  };

  const handleDoorAction = (action: 'toggle' | 'lock' | 'picklock') => {
    if (!gameState.contextMenu) return;
    const objectId = gameState.contextMenu.objectId;
    
    setGameState(prev => {
      const objects = prev.objects.map(obj => {
        if (obj.id !== objectId) return obj;
        
        if (action === 'toggle') {
          if (obj.isLocked && !obj.isOpen) {
            addLog(`${obj.name} is locked.`);
            return obj;
          }
          const newState = !obj.isOpen;
          addLog(`${obj.name} ${newState ? 'opened' : 'closed'}.`);
          return { ...obj, isOpen: newState };
        }
        
        if (action === 'lock') {
          if (obj.isOpen) {
            addLog(`Cannot lock ${obj.name} while it's open.`);
            return obj;
          }
          const newState = !obj.isLocked;
          addLog(`${obj.name} ${newState ? 'locked' : 'unlocked'}.`);
          return { ...obj, isLocked: newState };
        }
        
        if (action === 'picklock') {
          const success = Math.random() > 0.4;
          if (success) {
            addLog(`Successfully picked the lock on ${obj.name}!`);
            return { ...obj, isLocked: false };
          } else {
            addLog(`Failed to pick the lock on ${obj.name}.`);
            return obj;
          }
        }
        
        return obj;
      });
      
      return { ...prev, objects, contextMenu: null };
    });
  };

  const handleInventoryAction = {
    toggle: () => setGameState(prev => ({ ...prev, isInventoryOpen: !prev.isInventoryOpen })),
    equip: (item: Item) => {
      setGameState(prev => {
        const newPlayer = { ...player };
        if (!newPlayer.equipment) newPlayer.equipment = {};

        if (item.category === 'weapon') {
          if (newPlayer.equipment.weapon?.id === item.id) {
            newPlayer.equipment.weapon = undefined;
            addLog(`Unequipped ${item.name}.`);
          } else {
            newPlayer.equipment.weapon = item;
            addLog(`Equipped ${item.name}.`);
          }
        } else if (item.category === 'armor') {
          if (newPlayer.equipment.armor?.id === item.id) {
            newPlayer.equipment.armor = undefined;
            newPlayer.ac -= item.acBonus || 0;
            addLog(`Unequipped ${item.name}.`);
          } else {
            // Remove old armor AC
            if (newPlayer.equipment.armor) {
              newPlayer.ac -= newPlayer.equipment.armor.acBonus || 0;
            }
            newPlayer.equipment.armor = item;
            newPlayer.ac += item.acBonus || 0;
            addLog(`Equipped ${item.name}.`);
          }
        }

        return {
          ...prev,
          entities: prev.entities.map(e => e.id === 'player' ? newPlayer : e)
        };
      });
    },
    use: (item: Item) => {
      if (item.category !== 'chem') return;
      
      setGameState(prev => {
        const newPlayer = { ...player };
        if (item.effect?.startsWith('heal:')) {
          const amount = parseInt(item.effect.split(':')[1]);
          newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + amount);
          addLog(`Used ${item.name}. Restored ${amount} HP.`);
        }

        // Remove from inventory
        if (newPlayer.inventory) {
          const index = newPlayer.inventory.items.findIndex(i => i.id === item.id);
          if (index > -1) {
            const newItems = [...newPlayer.inventory.items];
            newItems.splice(index, 1);
            newPlayer.inventory = { ...newPlayer.inventory, items: newItems };
          }
        }

        return {
          ...prev,
          entities: prev.entities.map(e => e.id === 'player' ? newPlayer : e)
        };
      });
    },
    drop: (item: Item) => {
      setGameState(prev => {
        const newPlayer = { ...player };
        
        // Remove from equipment if equipped
        if (newPlayer.equipment?.weapon?.id === item.id) newPlayer.equipment.weapon = undefined;
        if (newPlayer.equipment?.armor?.id === item.id) {
          newPlayer.ac -= item.acBonus || 0;
          newPlayer.equipment.armor = undefined;
        }

        // Remove from inventory
        if (newPlayer.inventory) {
          const index = newPlayer.inventory.items.findIndex(i => i.id === item.id);
          if (index > -1) {
            const newItems = [...newPlayer.inventory.items];
            newItems.splice(index, 1);
            newPlayer.inventory = { ...newPlayer.inventory, items: newItems };
          }
        }

        // Add to world items
        const newWorldItem: WorldItem = {
          id: `drop-${Date.now()}`,
          gridX: player.gridX,
          gridY: player.gridY,
          item: item
        };

        addLog(`Dropped ${item.name}.`);

        return {
          ...prev,
          entities: prev.entities.map(e => e.id === 'player' ? newPlayer : e),
          worldItems: [...prev.worldItems, newWorldItem]
        };
      });
    }
  };

  const handleEndTurn = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      turn: 'enemy',
      entities: prev.entities.map(e => ({ ...e, ap: e.maxAp })),
    }));
    addLog('Enemy turn begins...');
  }, []);

  // Detection logic for wander mode
  useEffect(() => {
    if (gameState.mode === 'wander') {
      const enemies = gameState.entities.filter(e => e.type === 'enemy');
      for (const enemy of enemies) {
        const dist = Math.abs(enemy.gridX - player.gridX) + Math.abs(enemy.gridY - player.gridY);
        if (dist <= (enemy.detectionRange || 5)) {
          startCombat();
          break;
        }
      }
    }
  }, [player.gridX, player.gridY, gameState.mode, gameState.entities, startCombat]);

  // Enemy AI
  useEffect(() => {
    if (gameState.mode === 'combat' && gameState.turn === 'enemy') {
      const timer = setTimeout(() => {
        setGameState(prev => {
          const nextEntities = prev.entities.map(e => ({ ...e })); // Deep-ish copy
          const playerIdx = nextEntities.findIndex(e => e.id === 'player');
          const playerEntity = nextEntities[playerIdx];
          const enemies = nextEntities.filter(e => e.type === 'enemy');

          enemies.forEach(enemy => {
            const dist = Math.abs(enemy.gridX - playerEntity.gridX) + Math.abs(enemy.gridY - playerEntity.gridY);
            if (dist <= 1) {
              // Attack
              const toHit = calculateHitChance(enemy.ap, playerEntity.ac, 50);
              const roll = Math.floor(Math.random() * 100);
              if (roll <= toHit) {
                const damage = calculateDamage(2, 7);
                nextEntities[playerIdx].hp = Math.max(0, nextEntities[playerIdx].hp - damage);
                // Trigger effect outside of setGameState if possible, or just accept it here
                // Since triggerEffect uses setGameState, it's better to just log it and handle visuals
              }
            } else {
              // Move closer
              if (enemy.gridX < playerEntity.gridX) enemy.gridX++;
              else if (enemy.gridX > playerEntity.gridX) enemy.gridX--;
              else if (enemy.gridY < playerEntity.gridY) enemy.gridY++;
              else if (enemy.gridY > playerEntity.gridY) enemy.gridY--;
            }
          });

          return {
            ...prev,
            entities: nextEntities,
            turn: 'player',
            logs: ['Your turn begins. AP restored.', ...prev.logs].slice(0, 50),
          };
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.mode, gameState.turn]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      <div className="absolute inset-0 pb-40">
        <GameCanvas 
          gameState={gameState} 
          onTileClick={handleTileClick}
          onHover={handleHover}
        />
      </div>
      
      {player.hp <= 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
          <h1 className="text-red-600 font-mono text-6xl mb-8 animate-pulse uppercase tracking-tighter">You are Dead</h1>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 border-2 border-red-600 text-red-600 font-mono uppercase hover:bg-red-600 hover:text-black transition-all"
          >
            Reload Last Save
          </button>
        </div>
      )}

      {gameState.contextMenu && (
        <ContextMenu 
          x={gameState.contextMenu.x}
          y={gameState.contextMenu.y}
          object={gameState.objects.find(o => o.id === gameState.contextMenu!.objectId)!}
          onAction={handleDoorAction}
          onClose={() => setGameState(prev => ({ ...prev, contextMenu: null }))}
        />
      )}

      {gameState.isInventoryOpen && (
        <Inventory 
          player={player}
          onClose={handleInventoryAction.toggle}
          onEquip={handleInventoryAction.equip}
          onUse={handleInventoryAction.use}
          onDrop={handleInventoryAction.drop}
        />
      )}

      <FalloutHUD 
        player={player} 
        logs={gameState.logs} 
        turn={gameState.turn}
        mode={gameState.mode}
        onEndTurn={handleEndTurn}
        onCombatToggle={startCombat}
        onInventoryToggle={handleInventoryAction.toggle}
      />
    </div>
  );
}

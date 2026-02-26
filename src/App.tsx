import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { FalloutHUD } from './components/FalloutHUD';
import { ContextMenu } from './components/ContextMenu';
import { Inventory } from './components/Inventory';
import { EntityDetailModal } from './components/EntityDetailModal';
import { LevelUpModal } from './components/LevelUpModal';
import { SpriteEditor, generateNeuralLinkSprite, isNeuralLinkConfigured } from './features/neural-link';
import { Entity, GameState, Point, MapObject, Item, WorldItem } from './game/types';
import { getPath, calculateHitChance, calculateDamage } from './game/engine';

const INITIAL_ENTITIES: Entity[] = [
  {
    id: 'player',
    type: 'player',
    subType: 'vault_dweller',
    gridX: 2,
    gridY: 2,
    hp: 100,
    maxHp: 100,
    ap: 10,
    maxAp: 10,
    ac: 5,
    name: 'Vault Dweller',
    facing: 's',
    level: 1,
    exp: 0,
    nextLevelExp: 1000,
    skillPoints: 0,
    movementType: 'bipedal',
    size: 'medium',
    basePrompt: 'A vault dweller in a blue and yellow jumpsuit, carrying a small pack.',
  },
  {
    id: 'enemy-1',
    type: 'enemy',
    subType: 'radroach',
    gridX: 12,
    gridY: 12,
    hp: 40,
    maxHp: 40,
    ap: 8,
    maxAp: 8,
    ac: 2,
    name: 'Radroach',
    detectionRange: 5,
    expValue: 250,
    movementType: 'quadrupedal',
    size: 'small',
    basePrompt: 'A giant, mutated cockroach with glowing green patches.',
  },
  {
    id: 'enemy-2',
    type: 'enemy',
    subType: 'feral_ghoul',
    gridX: 18,
    gridY: 4,
    hp: 60,
    maxHp: 60,
    ap: 8,
    maxAp: 8,
    ac: 3,
    name: 'Feral Ghoul',
    detectionRange: 6,
    expValue: 500,
    movementType: 'bipedal',
    size: 'medium',
    basePrompt: 'A decaying, irradiated humanoid with tattered clothing and glowing eyes.',
  },
  {
    id: 'enemy-3',
    type: 'enemy',
    subType: 'super_mutant',
    gridX: 5,
    gridY: 18,
    hp: 120,
    maxHp: 120,
    ap: 6,
    maxAp: 6,
    ac: 10,
    name: 'Super Mutant',
    detectionRange: 4,
    expValue: 1500,
    movementType: 'bipedal',
    size: 'large',
    basePrompt: 'A massive, green-skinned brute wearing scrap metal armor and carrying a heavy pipe.',
  },
  {
    id: 'enemy-4',
    type: 'enemy',
    subType: 'raider',
    gridX: 15,
    gridY: 15,
    hp: 80,
    maxHp: 80,
    ap: 9,
    maxAp: 9,
    ac: 5,
    name: 'Raider',
    detectionRange: 7,
    expValue: 750,
    movementType: 'bipedal',
    size: 'medium',
    basePrompt: 'A wasteland survivor wearing spikes and leather, with a mohawk and face paint.',
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
    quantity: 1,
  },
  {
    id: 'leather-armor',
    name: 'Leather Armor',
    description: 'Tough cured leather provides basic protection.',
    category: 'armor',
    weight: 15,
    value: 700,
    acBonus: 10,
    quantity: 1,
  },
  {
    id: 'stimpak',
    name: 'Stimpak',
    description: 'A healing syringe that restores HP.',
    category: 'chem',
    weight: 0.1,
    value: 100,
    effect: 'heal:30',
    stackable: true,
    maxStack: 99,
    quantity: 1,
  },
  {
    id: 'water-chip',
    name: 'Water Chip',
    description: 'A critical component for a Vault water purification system.',
    category: 'quest',
    weight: 1,
    value: 0,
    quantity: 1,
  },
  {
    id: 'brass-key',
    name: 'Brass Key',
    description: 'A heavy brass key. Looks like it belongs to a sturdy lock.',
    category: 'misc',
    weight: 0.2,
    value: 10,
    quantity: 1,
  }
];

const INITIAL_WORLD_ITEMS: WorldItem[] = [
  {
    id: 'world-item-1',
    gridX: 5,
    gridY: 5,
    item: { ...SAMPLE_ITEMS[0], quantity: 1 },
  },
  {
    id: 'world-item-2',
    gridX: 8,
    gridY: 8,
    item: { ...SAMPLE_ITEMS[2], quantity: 5 },
  },
  {
    id: 'world-item-3',
    gridX: 12,
    gridY: 4,
    item: { ...SAMPLE_ITEMS[4], quantity: 1 },
  }
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    entities: INITIAL_ENTITIES.map(e => e.id === 'player' ? {
      ...e,
      inventory: { items: [{ ...SAMPLE_ITEMS[2], quantity: 3 }], maxWeight: 150 },
      equipment: {}
    } : e),
    turn: 'player',
    mode: 'wander',
    logs: ['Welcome to the Wasteland.', 'Wander mode active.', 'Use Arrow Keys or Alt+Drag to move the camera.'],
    selectedTile: null,
    hoveredTile: null,
    path: [],
    walls: INITIAL_WALLS,
    effects: [],
    shakeIntensity: 0,
    objects: INITIAL_OBJECTS,
    worldItems: INITIAL_WORLD_ITEMS,
    contextMenu: null,
    isInventoryOpen: false,
    quickSlots: [null, null, null, null],
    isLevelUpOpen: false,
    devMode: false,
    isSpriteEditorOpen: false,
  });
  const [walkingPath, setWalkingPath] = useState<Point[]>([]);

  const player = gameState.entities.find(e => e.id === 'player')!;
  const obstacles: Set<string> = new Set([
    ...gameState.walls,
    ...gameState.objects
      .filter(obj => obj.type === 'door' && !obj.isOpen)
      .map(obj => `${obj.gridX},${obj.gridY}`)
  ]);

  const addLog = useCallback((msg: string) => {
    setGameState(prev => ({
      ...prev,
      logs: [msg, ...prev.logs].slice(0, 50),
    }));
  }, []);

  const awardExp = useCallback((amount: number) => {
    setGameState(prev => {
      const player = prev.entities.find(e => e.id === 'player')!;
      let newExp = (player.exp || 0) + amount;
      let newLevel = player.level || 1;
      let newNextLevelExp = player.nextLevelExp || 1000;
      let newSkillPoints = player.skillPoints || 0;
      let leveledUp = false;

      while (newExp >= newNextLevelExp) {
        leveledUp = true;
        newLevel++;
        newSkillPoints += 3; // 3 points per level
        newNextLevelExp = newLevel * (newLevel - 1) * 500;
      }

      const updatedEntities = prev.entities.map(e => {
        if (e.id === 'player') {
          return {
            ...e,
            exp: newExp,
            level: newLevel,
            nextLevelExp: newNextLevelExp,
            skillPoints: newSkillPoints
          };
        }
        return e;
      });

      if (leveledUp) {
        addLog(`LEVEL UP! You are now level ${newLevel}.`);
      }

      return {
        ...prev,
        entities: updatedEntities,
        isLevelUpOpen: leveledUp ? true : prev.isLevelUpOpen
      };
    });
  }, [addLog]);

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

  const handleAttack = useCallback((targetId: string) => {
    setGameState(prev => {
      const player = prev.entities.find(e => e.id === 'player')!;
      const target = prev.entities.find(e => e.id === targetId);
      
      if (!target || target.type !== 'enemy') return prev;
      if (prev.turn !== 'player') return prev;

      const dist = Math.abs(player.gridX - target.gridX) + Math.abs(player.gridY - target.gridY);
      const weapon = player.equipment?.weapon;
      const apCost = weapon?.apCost || 4;
      const damageRange = weapon?.damage || { min: 1, max: 3 };

      if (dist > 1) {
        addLog('Too far to attack!');
        return prev;
      }

      if (player.ap < apCost) {
        addLog('Not enough AP to attack!');
        return prev;
      }

      const toHit = calculateHitChance(player.ap, target.ac);
      const roll = Math.floor(Math.random() * 100);
      
      if (roll <= toHit) {
        const damage = calculateDamage(damageRange.min, damageRange.max);
        addLog(`You hit ${target.name} for ${damage} damage!`);
        triggerEffect('impact', target.gridX, target.gridY);
        
        const nextEntities = prev.entities.map(e => {
          if (e.id === 'player') return { ...e, ap: e.ap - apCost };
          if (e.id === target.id) return { ...e, hp: Math.max(0, e.hp - damage) };
          return e;
        }).filter(e => e.hp > 0);

        const targetDied = !nextEntities.some(e => e.id === target.id);
        if (targetDied && target.expValue) {
          setTimeout(() => awardExp(target.expValue!), 500);
        }

        const enemiesLeft = nextEntities.some(e => e.type === 'enemy');
        return {
          ...prev,
          entities: nextEntities,
          mode: enemiesLeft ? 'combat' : 'wander',
          logs: enemiesLeft ? prev.logs : ['All hostiles eliminated. Wander mode active.', ...prev.logs].slice(0, 50),
        };
      } else {
        addLog(`You missed ${target.name}!`);
        triggerEffect('miss', target.gridX, target.gridY);
        return {
          ...prev,
          entities: prev.entities.map(e => e.id === 'player' ? { ...e, ap: e.ap - apCost } : e)
        };
      }
    });
  }, [addLog]);

  const handleTileClick = (point: Point, screenX: number, screenY: number) => {
    if (walkingPath.length > 0) return; // Ignore clicks while walking

    // Developer Mode: Click on entity to open profile
    if (gameState.devMode) {
      const entityAtTile = gameState.entities.find(e => e.gridX === point.x && e.gridY === point.y);
      if (entityAtTile) {
        setSelectedEntityId(entityAtTile.id);
        return;
      }
    }

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
          const itemWeight = worldItem.item.weight * (worldItem.item.quantity || 1);
          const currentWeight = newPlayer.inventory.items.reduce((sum, i) => sum + (i.weight * (i.quantity || 1)), 0);
          if (currentWeight + itemWeight > newPlayer.inventory.maxWeight) {
            addLog("Too heavy to pick up.");
            return prev;
          }

          let itemAdded = false;
          const newItems = newPlayer.inventory.items.map(i => {
            if (i.id === worldItem.item.id && i.stackable) {
              itemAdded = true;
              return { ...i, quantity: (i.quantity || 1) + (worldItem.item.quantity || 1) };
            }
            return i;
          });

          if (!itemAdded) {
            newItems.push({ ...worldItem.item });
          }
          
          newPlayer.inventory.items = newItems;
          addLog(`Picked up ${worldItem.item.name}${worldItem.item.quantity && worldItem.item.quantity > 1 ? ` (x${worldItem.item.quantity})` : ''}.`);
          
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

    // Check if clicking an entity (player or enemy)
    const clickedEntity = gameState.entities.find(e => e.gridX === point.x && e.gridY === point.y);
    
    // Always open modal for player
    if (clickedEntity?.id === 'player') {
      setSelectedEntityId(clickedEntity.id);
      return;
    }

    // Open modal for enemy in wander mode
    if (clickedEntity?.type === 'enemy' && gameState.mode === 'wander') {
      setSelectedEntityId(clickedEntity.id);
      return;
    }

    // Check if clicking an enemy for combat
    const enemy = gameState.entities.find(e => e.gridX === point.x && e.gridY === point.y && e.type === 'enemy');
    
    if (enemy) {
      if (gameState.mode === 'wander') {
        startCombat();
        return;
      }

      if (gameState.turn !== 'player') return;

      handleAttack(enemy.id);
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
      setGameState(prev => ({ ...prev, hoveredTile: null, path: [] }));
      return;
    }

    const path = getPath({ x: player.gridX, y: player.gridY }, point, obstacles);
    setGameState(prev => ({ ...prev, hoveredTile: point, path }));
  };

  const handleTileContextMenu = (point: Point, screenX: number, screenY: number) => {
    // Check if clicking an entity
    const entity = gameState.entities.find(e => e.gridX === point.x && e.gridY === point.y);
    if (entity) {
      setGameState(prev => ({
        ...prev,
        contextMenu: { x: screenX, y: screenY, entityId: entity.id }
      }));
      return;
    }

    // Check if clicking an object
    const object = gameState.objects.find(obj => obj.gridX === point.x && obj.gridY === point.y);
    if (object) {
      setGameState(prev => ({
        ...prev,
        contextMenu: { x: screenX, y: screenY, objectId: object.id }
      }));
      return;
    }

    // Close context menu if clicking empty tile
    if (gameState.contextMenu) {
      setGameState(prev => ({ ...prev, contextMenu: null }));
    }
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

        // Remove from inventory or decrement quantity
        let itemStillExists = true;
        let updatedItem: Item | null = null;

        if (newPlayer.inventory) {
          const index = newPlayer.inventory.items.findIndex(i => i.id === item.id);
          if (index > -1) {
            const targetItem = newPlayer.inventory.items[index];
            const newItems = [...newPlayer.inventory.items];
            if (targetItem.quantity && targetItem.quantity > 1) {
              updatedItem = { ...targetItem, quantity: targetItem.quantity - 1 };
              newItems[index] = updatedItem;
            } else {
              newItems.splice(index, 1);
              itemStillExists = false;
            }
            newPlayer.inventory = { ...newPlayer.inventory, items: newItems };
          }
        }

        // Update quick slots
        const newQuickSlots = prev.quickSlots.map(qs => {
          if (qs?.id === item.id) {
            return itemStillExists ? updatedItem : null;
          }
          return qs;
        });

        return {
          ...prev,
          entities: prev.entities.map(e => e.id === 'player' ? newPlayer : e),
          quickSlots: newQuickSlots
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

        // Remove from quick slots
        const newQuickSlots = prev.quickSlots.map(qs => qs?.id === item.id ? null : qs);

        return {
          ...prev,
          entities: prev.entities.map(e => e.id === 'player' ? newPlayer : e),
          worldItems: [...prev.worldItems, newWorldItem],
          quickSlots: newQuickSlots
        };
      });
    },
    assignQuickSlot: (item: Item, slotIndex: number) => {
      setGameState(prev => {
        const newQuickSlots = [...prev.quickSlots];
        newQuickSlots[slotIndex] = item;
        addLog(`Assigned ${item.name} to Quick Slot ${slotIndex + 1}.`);
        return { ...prev, quickSlots: newQuickSlots };
      });
    }
  };

  const handleQuickSlotUse = (index: number) => {
    const item = gameState.quickSlots[index];
    if (!item) return;

    if (item.category === 'weapon' || item.category === 'armor') {
      handleInventoryAction.equip(item);
    } else if (item.category === 'chem') {
      handleInventoryAction.use(item);
    } else {
      addLog(`Cannot use ${item.name} from quick slot.`);
    }
  };

  const [isGeneratingSkins, setIsGeneratingSkins] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const handleLevelUpApply = (updates: Partial<Entity>) => {
    setGameState(prev => ({
      ...prev,
      entities: prev.entities.map(e => e.id === 'player' ? { ...e, ...updates } : e),
      isLevelUpOpen: false
    }));
    addLog("Training complete. Your abilities have improved.");
  };

  const toggleDevMode = () => {
    setGameState(prev => {
      const newDevMode = !prev.devMode;
      addLog(newDevMode ? "DEVELOPER MODE ENABLED" : "DEVELOPER MODE DISABLED");
      return { ...prev, devMode: newDevMode, isSpriteEditorOpen: false };
    });
  };

  const toggleSpriteEditor = () => {
    setGameState(prev => ({ ...prev, isSpriteEditorOpen: !prev.isSpriteEditorOpen }));
  };

  const handleUpdateSprite = (entityId: string, spriteUrl: string) => {
    setGameState(prev => ({
      ...prev,
      entities: prev.entities.map(e => e.id === entityId ? { ...e, spriteUrl } : e)
    }));
  };

  const handleUpdateEntity = (entityId: string, updates: Partial<Entity>) => {
    setGameState(prev => ({
      ...prev,
      entities: prev.entities.map(e => e.id === entityId ? { ...e, ...updates } : e)
    }));
  };

  const generateSkins = useCallback(async (targetEntityId?: string) => {
    if (isGeneratingSkins) return;
    if (!isNeuralLinkConfigured()) {
      addLog('Pip-Boy: Gemini API key not configured. Visual generation is disabled.');
      return;
    }
    setIsGeneratingSkins(true);

    const entitiesToUpdate = targetEntityId 
      ? [gameState.entities.find(e => e.id === targetEntityId)].filter(Boolean) as Entity[]
      : []; // No automatic generation

    if (entitiesToUpdate.length === 0) {
      setIsGeneratingSkins(false);
      return;
    }

    addLog(`Pip-Boy: Recalibrating neural link for ${entitiesToUpdate[0].name}...`);

    try {
      const entity = entitiesToUpdate[0];
      const transparentSpriteUrl = await generateNeuralLinkSprite(entity);

      setGameState(prev => ({
        ...prev,
        entities: prev.entities.map(e => e.id === entity.id ? { ...e, spriteUrl: transparentSpriteUrl } : e)
      }));

      addLog("Pip-Boy: Visualization data synchronized.");
    } catch (error) {
      console.error("Skin generation failed:", error);
      addLog("Pip-Boy Error: Neural link synchronization failed.");
    } finally {
      setIsGeneratingSkins(false);
    }
  }, [gameState.entities, isGeneratingSkins, addLog]);

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
          onTileContextMenu={handleTileContextMenu}
          onHover={handleHover}
          selectedEntityId={selectedEntityId}
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
          title={
            gameState.contextMenu.objectId 
              ? gameState.objects.find(o => o.id === gameState.contextMenu!.objectId)?.name || 'Object'
              : gameState.entities.find(e => e.id === gameState.contextMenu!.entityId)?.name || 'Entity'
          }
          actions={
            gameState.contextMenu.objectId 
              ? (() => {
                  const obj = gameState.objects.find(o => o.id === gameState.contextMenu!.objectId)!;
                  return [
                    {
                      label: obj.isOpen ? 'Close' : 'Open',
                      shortcut: 'O',
                      onClick: () => handleDoorAction('toggle')
                    },
                    {
                      label: obj.isLocked ? 'Unlock' : 'Lock',
                      shortcut: 'L',
                      onClick: () => handleDoorAction('lock')
                    },
                    ...(obj.isLocked && !obj.isOpen ? [{
                      label: 'Pick Lock',
                      shortcut: 'P',
                      onClick: () => handleDoorAction('picklock')
                    }] : [])
                  ];
                })()
              : (() => {
                  const entity = gameState.entities.find(e => e.id === gameState.contextMenu!.entityId)!;
                  const isPlayer = entity.id === 'player';
                  const isEnemy = entity.type === 'enemy';
                  
                  return [
                    {
                      label: 'Inspect',
                      shortcut: 'I',
                      onClick: () => setSelectedEntityId(entity.id)
                    },
                    ...(isEnemy ? [{
                      label: 'Attack',
                      shortcut: 'A',
                      onClick: () => handleAttack(entity.id),
                      disabled: gameState.turn !== 'player' || player.ap < (player.equipment?.weapon?.apCost || 4),
                      variant: 'danger' as const
                    }] : []),
                    ...(isPlayer ? [{
                      label: 'Inventory',
                      shortcut: 'B',
                      onClick: () => handleInventoryAction.toggle()
                    }] : []),
                    {
                      label: 'Regen Visuals',
                      shortcut: 'R',
                      onClick: () => generateSkins(entity.id)
                    }
                  ];
                })()
          }
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
          onAssignQuickSlot={handleInventoryAction.assignQuickSlot}
        />
      )}

      {gameState.isLevelUpOpen && (
        <LevelUpModal 
          player={player}
          onClose={() => setGameState(prev => ({ ...prev, isLevelUpOpen: false }))}
          onApply={handleLevelUpApply}
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
        quickSlots={gameState.quickSlots}
        onQuickSlotUse={handleQuickSlotUse}
        isGeneratingSkins={isGeneratingSkins}
        devMode={gameState.devMode}
        onDevModeToggle={toggleDevMode}
        onSpriteEditorToggle={toggleSpriteEditor}
      />

      {gameState.isSpriteEditorOpen && (
        <SpriteEditor 
          entities={gameState.entities}
          onClose={toggleSpriteEditor}
          onUpdateSprite={handleUpdateSprite}
          onUpdateEntity={handleUpdateEntity}
          onRegenerate={generateSkins}
          isGenerating={isGeneratingSkins}
        />
      )}

      {selectedEntityId && (
        <EntityDetailModal 
          entity={gameState.entities.find(e => e.id === selectedEntityId)!}
          onClose={() => setSelectedEntityId(null)}
          onRegenerate={(id) => generateSkins(id)}
          isGenerating={isGeneratingSkins}
          mode={gameState.mode}
          onStartCombat={startCombat}
          onAttack={handleAttack}
          canAttack={player.ap >= (player.equipment?.weapon?.apCost || 4)}
          devMode={gameState.devMode}
          onUpdateEntity={handleUpdateEntity}
        />
      )}
    </div>
  );
}

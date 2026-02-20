import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { FalloutHUD } from './components/FalloutHUD';
import { Entity, GameState, Point } from './game/types';
import { getPath } from './game/engine';

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

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    entities: INITIAL_ENTITIES,
    turn: 'player',
    mode: 'wander',
    logs: ['Welcome to the Wasteland.', 'Wander mode active.'],
    selectedTile: null,
    path: [],
  });

  const player = gameState.entities.find(e => e.id === 'player')!;

  const addLog = (msg: string) => {
    setGameState(prev => ({
      ...prev,
      logs: [msg, ...prev.logs].slice(0, 50),
    }));
  };

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
  }, []);

  const handleTileClick = (point: Point) => {
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
      if (dist <= 1) {
        if (player.ap >= 4) {
          const toHit = 60 + (player.ap * 2) - (enemy.ac * 2);
          const roll = Math.floor(Math.random() * 100);
          
          if (roll <= toHit) {
            const damage = Math.floor(Math.random() * 10) + 5;
            addLog(`You hit ${enemy.name} for ${damage} damage!`);
            
            setGameState(prev => {
              const nextEntities = prev.entities.map(e => {
                if (e.id === 'player') return { ...e, ap: e.ap - 4 };
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
    const path = getPath({ x: player.gridX, y: player.gridY }, point);
    
    if (gameState.mode === 'wander') {
      setGameState(prev => ({
        ...prev,
        entities: prev.entities.map(e => 
          e.id === 'player' ? { ...e, gridX: point.x, gridY: point.y } : e
        ),
        path: [],
      }));
    } else {
      if (gameState.turn !== 'player') return;
      const apCost = path.length;
      if (apCost <= player.ap) {
        setGameState(prev => ({
          ...prev,
          entities: prev.entities.map(e => 
            e.id === 'player' ? { ...e, gridX: point.x, gridY: point.y, ap: e.ap - apCost } : e
          ),
          path: [],
        }));
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

    const path = getPath({ x: player.gridX, y: player.gridY }, point);
    setGameState(prev => ({ ...prev, selectedTile: point, path }));
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
          const newEntities = [...prev.entities];
          const playerIdx = newEntities.findIndex(e => e.id === 'player');
          const enemies = newEntities.filter(e => e.type === 'enemy');

          enemies.forEach(enemy => {
            const dist = Math.abs(enemy.gridX - player.gridX) + Math.abs(enemy.gridY - player.gridY);
            if (dist <= 1) {
              // Attack
              const toHit = 50 - (player.ac * 2);
              const roll = Math.floor(Math.random() * 100);
              if (roll <= toHit) {
                const damage = Math.floor(Math.random() * 5) + 2;
                newEntities[playerIdx].hp = Math.max(0, newEntities[playerIdx].hp - damage);
              }
            } else {
              // Move closer
              if (enemy.gridX < player.gridX) enemy.gridX++;
              else if (enemy.gridX > player.gridX) enemy.gridX--;
              else if (enemy.gridY < player.gridY) enemy.gridY++;
              else if (enemy.gridY > player.gridY) enemy.gridY--;
            }
          });

          return {
            ...prev,
            entities: newEntities,
            turn: 'player',
          };
        });
        addLog('Your turn begins. AP restored.');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.mode, gameState.turn, player.gridX, player.gridY, player.ac]);

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

      <FalloutHUD 
        player={player} 
        logs={gameState.logs} 
        turn={gameState.turn}
        mode={gameState.mode}
        onEndTurn={handleEndTurn}
        onCombatToggle={startCombat}
      />
    </div>
  );
}

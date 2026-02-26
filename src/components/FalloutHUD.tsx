import React from 'react';
import { Entity, Item } from '../game/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FalloutHUDProps {
  player: Entity;
  logs: string[];
  turn: 'player' | 'enemy';
  mode: 'wander' | 'combat';
  onEndTurn: () => void;
  onCombatToggle: () => void;
  onInventoryToggle: () => void;
  quickSlots: (Item | null)[];
  onQuickSlotUse: (index: number) => void;
  isGeneratingSkins?: boolean;
  devMode?: boolean;
  onDevModeToggle?: () => void;
  onSpriteEditorToggle?: () => void;
}

export const FalloutHUD: React.FC<FalloutHUDProps> = ({ 
  player, 
  logs, 
  turn, 
  mode, 
  onEndTurn, 
  onCombatToggle,
  onInventoryToggle,
  quickSlots,
  onQuickSlotUse,
  isGeneratingSkins,
  devMode,
  onDevModeToggle,
  onSpriteEditorToggle
}) => {
  const equippedWeapon = player.equipment?.weapon;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-40 bg-[#2a2a24] border-t-4 border-[#3a3a34] flex items-center px-4 gap-4 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      {/* Left: Log Screen */}
      <div className="w-1/4 h-[85%] bg-black border-2 border-[#4a4a44] rounded p-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-20" />
        {isGeneratingSkins && (
          <div className="absolute inset-0 bg-[#4ade80]/10 flex items-center justify-center z-20">
            <div className="text-[#4ade80] font-mono text-[8px] animate-pulse uppercase">Neural Link Sync...</div>
          </div>
        )}
        <div className="h-full overflow-y-auto font-mono text-[10px] text-[#4ade80] space-y-1 scrollbar-hide">
          {logs.map((log, i) => (
            <div key={i} className="leading-tight">{`> ${log}`}</div>
          ))}
        </div>
      </div>

      {/* Center: Action Panel */}
      <div className="flex-1 h-[85%] bg-[#1a1a14] border-2 border-[#3a3a34] rounded flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#3a3a34]" />
        
        <div className="absolute top-2 left-2 text-[8px] font-mono text-[#4ade80]/50 uppercase">
          {mode === 'wander' ? 'Exploration Mode' : `Combat Mode - ${turn === 'player' ? 'Your Turn' : 'Enemy Turn'}`}
        </div>

        <div className="flex gap-8 items-center mt-2">
          {/* INV Button */}
          <div className="flex flex-col gap-1">
            <button 
              onClick={onInventoryToggle}
              className="w-10 h-6 bg-[#4a1a1a] border border-[#6a2a2a] text-[8px] text-white font-bold rounded shadow-inner hover:bg-[#5a2a2a] transition-colors"
            >
              INV
            </button>
            <div className="w-2 h-2 rounded-full bg-red-900 mx-auto shadow-[0_0_5px_rgba(255,0,0,0.5)]" />
          </div>

          {/* Weapon Display */}
          <div className="w-56 h-28 bg-black border-2 border-[#4a4a44] rounded flex flex-col p-2 relative shadow-inner">
            <div className="flex justify-between items-start mb-1">
              <div className="text-[#4ade80] font-mono text-[10px] uppercase font-bold truncate max-w-[120px]">
                {equippedWeapon ? equippedWeapon.name : 'UNARMED'}
              </div>
              <div className="bg-[#4ade80]/10 border border-[#4ade80]/30 px-1 rounded">
                <span className="text-[#4ade80] font-mono text-[8px] uppercase">Cost: {equippedWeapon?.apCost || 4} AP</span>
              </div>
            </div>
            
            <div className="flex-1 bg-[#1a1a14] border border-[#3a3a34] rounded flex items-center justify-center overflow-hidden mb-1">
              <img 
                src={equippedWeapon ? `https://picsum.photos/seed/${equippedWeapon.id}/120/48` : "https://picsum.photos/seed/fist/120/48"} 
                alt="weapon" 
                className="opacity-40 grayscale contrast-150 hover:opacity-60 transition-opacity" 
                referrerPolicy="no-referrer" 
              />
            </div>

            <div className="flex justify-between items-center mt-auto">
              <div className="text-[#4ade80] font-mono text-[9px] flex items-center gap-1">
                <span className="opacity-50">DMG:</span>
                <span className="text-white">{equippedWeapon ? `${equippedWeapon.damage?.min}-${equippedWeapon.damage?.max}` : '1-3'}</span>
              </div>
              <div className="text-[#4ade80] font-mono text-[9px] flex items-center gap-1">
                <span className="opacity-50">TYPE:</span>
                <span className="text-white uppercase">{equippedWeapon?.category || 'Melee'}</span>
              </div>
            </div>
          </div>

          {/* AP Display */}
          <div className="flex flex-col items-center bg-black/40 p-2 border border-[#3a3a34] rounded min-w-[120px] shadow-inner">
             <div className="flex justify-between w-full mb-2 px-1 border-b border-[#4ade80]/20 pb-1">
               <span className="text-[#4ade80] font-mono text-[10px] font-bold tracking-widest">ACTION POINTS</span>
               <span className="text-white font-mono text-[10px] font-bold">{player.ap}/{player.maxAp}</span>
             </div>
             <div className="flex gap-1.5 flex-wrap justify-center max-w-[140px]">
                {Array.from({ length: player.maxAp }).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-3.5 h-3.5 rounded-sm border transition-all duration-300",
                      i < player.ap 
                        ? "bg-[#4ade80] border-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.8)]" 
                        : "bg-black/80 border-[#4ade80]/20"
                    )} 
                  />
                ))}
             </div>
          </div>

          {/* Quick Slots */}
          <div className="flex flex-col gap-1 ml-4 border-l border-[#3a3a34] pl-4">
            <div className="text-[#4ade80] font-mono text-[8px] uppercase opacity-50 text-center mb-1">Quick Slots</div>
            <div className="grid grid-cols-2 gap-2">
              {quickSlots.map((item, i) => (
                <button
                  key={i}
                  onClick={() => onQuickSlotUse(i)}
                  disabled={!item}
                  className={cn(
                    "w-10 h-10 border-2 flex items-center justify-center relative group transition-all",
                    item 
                      ? "bg-black border-[#4ade80]/40 hover:border-[#4ade80] hover:bg-[#4ade80]/20 shadow-[0_0_5px_rgba(74,222,128,0.2)]" 
                      : "bg-black/20 border-[#3a3a34] cursor-not-allowed"
                  )}
                  title={item?.name || 'Empty Slot'}
                >
                  {item ? (
                    <>
                      <img 
                        src={`https://picsum.photos/seed/${item.id}/40/40`} 
                        alt={item.name} 
                        className="w-full h-full object-cover opacity-40 group-hover:opacity-80 grayscale contrast-125"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-[#4ade80]/5 group-hover:bg-transparent transition-colors" />
                      <span className="absolute -top-1 -left-1 bg-black text-[#4ade80] text-[7px] font-bold px-1 border border-[#4ade80]/30 z-10">{i + 1}</span>
                      {item.quantity && item.quantity > 1 && (
                        <span className="absolute -bottom-1 -right-1 bg-black text-white text-[7px] px-1 border border-[#4ade80]/30 z-10">x{item.quantity}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-[#3a3a34] text-[10px] font-bold">{i + 1}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Stats & Buttons */}
      <div className="w-1/4 h-[85%] flex gap-4">
        {/* Stats */}
        <div className="flex-1 bg-[#1a1a14] border-2 border-[#3a3a34] rounded p-2 flex flex-col justify-around font-mono text-[10px]">
          <div className="flex justify-between items-center text-[#4ade80]">
            <span>LVL</span>
            <span className="text-white text-xs">{player.level || 1}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-[#4ade80] text-[8px]">
              <span>EXP</span>
              <span>{player.exp || 0}/{player.nextLevelExp || 1000}</span>
            </div>
            <div className="w-full h-1 bg-black border border-[#4ade80]/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#4ade80] transition-all duration-500"
                style={{ width: `${Math.min(100, ((player.exp || 0) / (player.nextLevelExp || 1000)) * 100)}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between items-center text-[#4ade80]">
            <span>HP</span>
            <span className="text-white text-xs">{player.hp}/{player.maxHp}</span>
          </div>
          <div className="flex justify-between items-center text-[#4ade80]">
            <span>AC</span>
            <span className="text-white text-xs">{player.ac}</span>
          </div>
          <div className="flex justify-between items-center text-[#4ade80]">
             <button 
                onClick={mode === 'wander' ? onCombatToggle : onEndTurn}
                className={cn(
                  "w-full py-1 rounded border font-bold uppercase transition-all",
                  mode === 'wander' 
                    ? "bg-red-900/20 border-red-900 text-red-500 hover:bg-red-900/40" 
                    : "bg-[#4ade80]/20 border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80]/40"
                )}
             >
                {mode === 'wander' ? 'Combat' : 'End Turn'}
             </button>
          </div>
        </div>

        {/* System Buttons */}
        <div className="grid grid-cols-1 gap-1 w-12">
          <button 
            onClick={onDevModeToggle}
            className={cn(
              "h-6 border border-[#4a4a44] text-[8px] font-bold rounded transition-colors",
              devMode ? "bg-[#4ade80] text-black border-[#4ade80]" : "bg-[#3a3a34] text-white hover:bg-[#4a4a44]"
            )}
          >
            DEV
          </button>
          {devMode && (
            <button 
              onClick={onSpriteEditorToggle}
              className="h-6 bg-[#4ade80]/20 border border-[#4ade80] text-[8px] text-[#4ade80] font-bold rounded hover:bg-[#4ade80]/40 transition-colors"
            >
              SPR
            </button>
          )}
          <button className="h-6 bg-[#3a3a34] border border-[#4a4a44] text-[8px] text-white font-bold rounded hover:bg-[#4a4a44]">MAP</button>
          <button className="h-6 bg-[#3a3a34] border border-[#4a4a44] text-[8px] text-white font-bold rounded hover:bg-[#4a4a44]">CHA</button>
          <button className="h-6 bg-[#3a3a34] border border-[#4a4a44] text-[8px] text-white font-bold rounded hover:bg-[#4a4a44]">PIP</button>
        </div>
      </div>
    </div>
  );
};

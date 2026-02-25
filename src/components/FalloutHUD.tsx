import React from 'react';
import { Entity } from '../game/types';
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
  isGeneratingSkins?: boolean;
}

export const FalloutHUD: React.FC<FalloutHUDProps> = ({ 
  player, 
  logs, 
  turn, 
  mode, 
  onEndTurn, 
  onCombatToggle,
  onInventoryToggle,
  isGeneratingSkins
}) => {
  const equippedWeapon = player.equipment?.weapon;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-40 bg-[#2a2a24] border-t-4 border-[#3a3a34] flex items-center px-4 gap-4 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      {/* Left: Log Screen */}
      <div className="w-1/4 h-[85%] bg-black border-2 border-[#4a4a44] rounded p-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-20" />
        {isGeneratingSkins && (
          <div className="absolute inset-0 bg-[#4ade80]/10 flex items-center justify-center z-20">
            <div className="text-[#4ade80] font-mono text-[8px] animate-pulse uppercase">Syncing Neural Link...</div>
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
          <div className="w-48 h-20 bg-black border border-[#4a4a44] rounded flex flex-col items-center justify-center p-1">
            <div className="text-[#4ade80] font-mono text-[10px] mb-1 uppercase">
              {equippedWeapon ? equippedWeapon.name : 'UNARMED'}
            </div>
            <div className="w-full h-10 bg-[#1a1a14] flex items-center justify-center">
              <img 
                src={equippedWeapon ? `https://picsum.photos/seed/${equippedWeapon.id}/100/40` : "https://picsum.photos/seed/fist/100/40"} 
                alt="weapon" 
                className="opacity-50 grayscale contrast-150" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <div className="text-[#4ade80] font-mono text-[8px] mt-1">
              {equippedWeapon ? `${equippedWeapon.damage?.min}-${equippedWeapon.damage?.max} DMG` : '1-3 DMG'}
            </div>
          </div>

          {/* AP Display */}
          <div className="flex flex-col items-center">
             <div className="text-[#4ade80] font-mono text-[10px] mb-1">AP</div>
             <div className="flex gap-1">
                {Array.from({ length: player.maxAp }).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-2 h-2 rounded-sm border border-[#4ade80]/30",
                      i < player.ap ? "bg-[#4ade80] shadow-[0_0_5px_#4ade80]" : "bg-black"
                    )} 
                  />
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
          <button className="h-6 bg-[#3a3a34] border border-[#4a4a44] text-[8px] text-white font-bold rounded hover:bg-[#4a4a44]">MAP</button>
          <button className="h-6 bg-[#3a3a34] border border-[#4a4a44] text-[8px] text-white font-bold rounded hover:bg-[#4a4a44]">CHA</button>
          <button className="h-6 bg-[#3a3a34] border border-[#4a4a44] text-[8px] text-white font-bold rounded hover:bg-[#4a4a44]">PIP</button>
        </div>
      </div>
    </div>
  );
};

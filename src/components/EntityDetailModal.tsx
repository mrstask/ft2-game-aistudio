import React from 'react';
import { Entity } from '../game/types';
import { X, RefreshCw, Shield, Zap, Heart, TrendingUp } from 'lucide-react';

interface EntityDetailModalProps {
  entity: Entity;
  onClose: () => void;
  onRegenerate: (entityId: string) => void;
  isGenerating: boolean;
  onAttack?: (entityId: string) => void;
  onStartCombat?: () => void;
  mode: 'wander' | 'combat';
  canAttack?: boolean;
  devMode?: boolean;
  onUpdateEntity?: (entityId: string, updates: Partial<Entity>) => void;
}

export const EntityDetailModal: React.FC<EntityDetailModalProps> = ({ 
  entity, 
  onClose, 
  onRegenerate,
  isGenerating,
  onAttack,
  onStartCombat,
  mode,
  canAttack,
  devMode,
  onUpdateEntity
}) => {
  const isPlayer = entity.id === 'player';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#2a2a24] border-4 border-[#3a3a34] rounded-lg shadow-2xl overflow-hidden relative">
        {/* Pip-Boy Scanline Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-30" />
        
        {/* Header */}
        <div className="bg-[#3a3a34] p-3 flex justify-between items-center border-b-2 border-[#4a4a44]">
          <h2 className="text-[#4ade80] font-mono font-bold uppercase tracking-wider">
            {isPlayer ? 'Personal Status' : 'Target Analysis'}
          </h2>
          <button onClick={onClose} className="text-[#4ade80] hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Sprite Display */}
          <div className="relative aspect-square w-48 mx-auto bg-black border-2 border-[#4a4a44] rounded-lg flex items-center justify-center overflow-hidden group">
            {entity.spriteUrl ? (
              <img 
                src={entity.spriteUrl} 
                alt={entity.name} 
                className="w-full h-full object-contain pixelated"
              />
            ) : (
              <div className="text-[#4ade80]/30 font-mono text-xs uppercase">No Visual Data</div>
            )}
            
            {isGenerating && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-8 h-8 text-[#4ade80] animate-spin" />
                <span className="text-[#4ade80] font-mono text-[10px] uppercase animate-pulse">Reconstructing...</span>
              </div>
            )}

            <button 
              onClick={() => onRegenerate(entity.id)}
              disabled={isGenerating}
              className="absolute bottom-2 right-2 p-2 bg-[#4ade80] text-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              title="Regenerate Neural Link"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/40 p-3 border border-[#4a4a44] rounded">
              <div className="flex items-center justify-between text-[#4ade80] mb-1">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  <span className="text-[10px] font-mono uppercase opacity-70">Vitality</span>
                </div>
                {devMode && onUpdateEntity && (
                  <div className="flex gap-1">
                    <button onClick={() => onUpdateEntity(entity.id, { hp: Math.max(0, entity.hp - 10) })} className="text-red-500 hover:text-red-400">-</button>
                    <button onClick={() => onUpdateEntity(entity.id, { hp: Math.min(entity.maxHp, entity.hp + 10) })} className="text-green-500 hover:text-green-400">+</button>
                  </div>
                )}
              </div>
              <div className="text-white font-mono text-lg">{entity.hp} / {entity.maxHp}</div>
            </div>

            <div className="bg-black/40 p-3 border border-[#4a4a44] rounded">
              <div className="flex items-center justify-between text-[#4ade80] mb-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span className="text-[10px] font-mono uppercase opacity-70">Action Points</span>
                </div>
                {devMode && onUpdateEntity && (
                  <div className="flex gap-1">
                    <button onClick={() => onUpdateEntity(entity.id, { ap: Math.max(0, entity.ap - 1) })} className="text-red-500 hover:text-red-400">-</button>
                    <button onClick={() => onUpdateEntity(entity.id, { ap: Math.min(entity.maxAp, entity.ap + 1) })} className="text-green-500 hover:text-green-400">+</button>
                  </div>
                )}
              </div>
              <div className="text-white font-mono text-lg">{entity.ap} / {entity.maxAp}</div>
            </div>

            <div className="bg-black/40 p-3 border border-[#4a4a44] rounded">
              <div className="flex items-center justify-between text-[#4ade80] mb-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-[10px] font-mono uppercase opacity-70">Armor Class</span>
                </div>
                {devMode && onUpdateEntity && (
                  <div className="flex gap-1">
                    <button onClick={() => onUpdateEntity(entity.id, { ac: Math.max(0, entity.ac - 1) })} className="text-red-500 hover:text-red-400">-</button>
                    <button onClick={() => onUpdateEntity(entity.id, { ac: entity.ac + 1 })} className="text-green-500 hover:text-green-400">+</button>
                  </div>
                )}
              </div>
              <div className="text-white font-mono text-lg">{entity.ac}</div>
            </div>

            {isPlayer && (
              <div className="bg-black/40 p-3 border border-[#4a4a44] rounded col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2 text-[#4ade80]">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-[10px] font-mono uppercase opacity-70">Experience (LVL {entity.level})</span>
                  </div>
                  <span className="text-white font-mono text-[10px]">{entity.exp} / {entity.nextLevelExp}</span>
                </div>
                <div className="w-full h-1.5 bg-black border border-[#4ade80]/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#4ade80] transition-all duration-500"
                    style={{ width: `${Math.min(100, ((entity.exp || 0) / (entity.nextLevelExp || 1000)) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="bg-black/40 p-3 border border-[#4a4a44] rounded">
              <div className="flex items-center gap-2 text-[#4ade80] mb-1">
                <RefreshCw className="w-4 h-4" />
                <span className="text-[10px] font-mono uppercase opacity-70">Designation</span>
              </div>
              <div className="text-white font-mono text-sm uppercase truncate">{entity.name}</div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-[#1a1a14] border-t-2 border-[#3a3a34] flex gap-2">
          {!isPlayer && mode === 'wander' && onStartCombat && (
            <button 
              onClick={() => {
                onStartCombat();
                onClose();
              }}
              className="flex-1 py-2 bg-red-900/20 border border-red-600 text-red-500 font-mono font-bold uppercase hover:bg-red-900/40 transition-all"
            >
              Initiate Combat
            </button>
          )}

          {!isPlayer && mode === 'combat' && onAttack && (
            <button 
              onClick={() => {
                onAttack(entity.id);
                onClose();
              }}
              disabled={!canAttack}
              className="flex-1 py-2 bg-red-900/20 border border-red-600 text-red-500 font-mono font-bold uppercase hover:bg-red-900/40 transition-all disabled:opacity-30"
            >
              Attack Target
            </button>
          )}

          <button 
            onClick={() => onRegenerate(entity.id)}
            disabled={isGenerating}
            className="flex-1 py-2 bg-[#4ade80]/10 border border-[#4ade80] text-[#4ade80] font-mono font-bold uppercase hover:bg-[#4ade80]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Regen Visuals
          </button>
        </div>
      </div>
    </div>
  );
};

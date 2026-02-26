import React, { useState } from 'react';
import { Entity } from '../game/types';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, Heart, Zap, Shield, ChevronRight } from 'lucide-react';

interface LevelUpModalProps {
  player: Entity;
  onClose: () => void;
  onApply: (updates: Partial<Entity>) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ player, onClose, onApply }) => {
  const [skillPoints, setSkillPoints] = useState(player.skillPoints || 0);
  const [hpBonus, sethpBonus] = useState(0);
  const [apBonus, setapBonus] = useState(0);
  const [acBonus, setacBonus] = useState(0);

  const canIncrease = skillPoints > 0;

  const handleIncrease = (type: 'hp' | 'ap' | 'ac') => {
    if (!canIncrease) return;
    setSkillPoints(prev => prev - 1);
    if (type === 'hp') sethpBonus(prev => prev + 10);
    if (type === 'ap') setapBonus(prev => prev + 1);
    if (type === 'ac') setacBonus(prev => prev + 2);
  };

  const handleReset = () => {
    setSkillPoints(player.skillPoints || 0);
    sethpBonus(0);
    setapBonus(0);
    setacBonus(0);
  };

  const handleApply = () => {
    onApply({
      maxHp: player.maxHp + hpBonus,
      hp: player.hp + hpBonus,
      maxAp: player.maxAp + apBonus,
      ap: player.ap + apBonus,
      ac: player.ac + acBonus,
      skillPoints: skillPoints
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-[#1a1a1a] border-4 border-[#4ade80] w-full max-w-md p-6 shadow-[0_0_50px_rgba(74,222,128,0.3)] relative overflow-hidden"
        >
          {/* Scanline effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
          
          <div className="flex items-center justify-between mb-6 border-b-2 border-[#4ade80]/30 pb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-[#4ade80] w-8 h-8" />
              <div>
                <h2 className="text-[#4ade80] font-mono text-2xl uppercase tracking-tighter font-black">Level Up!</h2>
                <div className="text-[#4ade80]/60 font-mono text-xs uppercase">Vault-Tec Training Manual</div>
              </div>
            </div>
          </div>

          <div className="mb-8 bg-black/40 p-4 border border-[#4ade80]/20 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#4ade80] font-mono text-sm uppercase">Available Points</span>
              <span className="text-white font-mono text-2xl font-bold animate-pulse">{skillPoints}</span>
            </div>
            <div className="h-1 bg-[#4ade80]/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#4ade80] transition-all duration-500"
                style={{ width: `${(skillPoints / (player.skillPoints || 1)) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {/* HP */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#4ade80]/10 rounded border border-[#4ade80]/20">
                  <Heart className="w-5 h-5 text-[#4ade80]" />
                </div>
                <div>
                  <div className="text-white font-mono text-sm uppercase font-bold">Hit Points</div>
                  <div className="text-[#4ade80]/50 font-mono text-[10px] uppercase">+{hpBonus} Bonus</div>
                </div>
              </div>
              <button 
                onClick={() => handleIncrease('hp')}
                disabled={!canIncrease}
                className="w-10 h-10 border-2 border-[#4ade80] text-[#4ade80] flex items-center justify-center hover:bg-[#4ade80] hover:text-black transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronRight />
              </button>
            </div>

            {/* AP */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#4ade80]/10 rounded border border-[#4ade80]/20">
                  <Zap className="w-5 h-5 text-[#4ade80]" />
                </div>
                <div>
                  <div className="text-white font-mono text-sm uppercase font-bold">Action Points</div>
                  <div className="text-[#4ade80]/50 font-mono text-[10px] uppercase">+{apBonus} Bonus</div>
                </div>
              </div>
              <button 
                onClick={() => handleIncrease('ap')}
                disabled={!canIncrease}
                className="w-10 h-10 border-2 border-[#4ade80] text-[#4ade80] flex items-center justify-center hover:bg-[#4ade80] hover:text-black transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronRight />
              </button>
            </div>

            {/* AC */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#4ade80]/10 rounded border border-[#4ade80]/20">
                  <Shield className="w-5 h-5 text-[#4ade80]" />
                </div>
                <div>
                  <div className="text-white font-mono text-sm uppercase font-bold">Armor Class</div>
                  <div className="text-[#4ade80]/50 font-mono text-[10px] uppercase">+{acBonus} Bonus</div>
                </div>
              </div>
              <button 
                onClick={() => handleIncrease('ac')}
                disabled={!canIncrease}
                className="w-10 h-10 border-2 border-[#4ade80] text-[#4ade80] flex items-center justify-center hover:bg-[#4ade80] hover:text-black transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronRight />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleReset}
              className="flex-1 py-3 border-2 border-[#4ade80]/30 text-[#4ade80]/60 font-mono uppercase text-sm hover:border-[#4ade80] hover:text-[#4ade80] transition-all"
            >
              Reset
            </button>
            <button 
              onClick={handleApply}
              disabled={skillPoints > 0}
              className="flex-2 py-3 bg-[#4ade80] text-black font-mono uppercase text-sm font-bold hover:bg-[#22c55e] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Training
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

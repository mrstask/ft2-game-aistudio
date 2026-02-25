import React from 'react';
import { Item, Entity, Inventory as InventoryType } from '../game/types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Package, Shield, Sword, FlaskConical, ScrollText, Trash2, CheckCircle2 } from 'lucide-react';

interface InventoryProps {
  player: Entity;
  onClose: () => void;
  onEquip: (item: Item) => void;
  onUse: (item: Item) => void;
  onDrop: (item: Item) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ player, onClose, onEquip, onUse, onDrop }) => {
  const inventory = player.inventory || { items: [], maxWeight: 100 };
  const currentWeight = inventory.items.reduce((sum, item) => sum + (item.weight * (item.quantity || 1)), 0);

  const getIcon = (category: string) => {
    switch (category) {
      case 'weapon': return <Sword className="w-4 h-4" />;
      case 'armor': return <Shield className="w-4 h-4" />;
      case 'chem': return <FlaskConical className="w-4 h-4" />;
      case 'quest': return <ScrollText className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const isEquipped = (item: Item) => {
    return player.equipment?.weapon?.id === item.id || player.equipment?.armor?.id === item.id;
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <div className="bg-[#1a1a1a] border-2 border-[#4a4a44] w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-[#4a4a44] bg-[#2a2a24]">
            <div className="flex items-center gap-3">
              <Package className="text-[#4ade80]" />
              <h2 className="text-[#4ade80] font-mono text-xl uppercase tracking-widest">Inventory</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-[#4ade80] hover:bg-[#4ade80] hover:text-black p-1 transition-colors"
            >
              <X />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="p-4 bg-[#222] border-b border-[#4a4a44] flex justify-between items-center font-mono text-sm">
            <div className="flex gap-6">
              <div className="text-white">
                <span className="text-[#4ade80] uppercase mr-2">Weight:</span>
                {currentWeight.toFixed(1)} / {inventory.maxWeight}
              </div>
              <div className="text-white">
                <span className="text-[#4ade80] uppercase mr-2">AC:</span>
                {player.ac}
              </div>
            </div>
            <div className="w-48 h-2 bg-black border border-[#4a4a44] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#4ade80] transition-all duration-500"
                style={{ width: `${Math.min(100, (currentWeight / inventory.maxWeight) * 100)}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {inventory.items.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#4a4a44] font-mono uppercase">
                Inventory Empty
              </div>
            ) : (
              inventory.items.map((item, idx) => (
                <motion.div 
                  key={`${item.id}-${idx}`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`group flex items-center gap-4 p-3 border border-[#4a4a44] bg-[#222] hover:bg-[#2a2a2a] transition-colors ${isEquipped(item) ? 'border-[#4ade80]/50 bg-[#4ade80]/5' : ''}`}
                >
                  <div className={`p-2 rounded bg-black/40 ${isEquipped(item) ? 'text-[#4ade80]' : 'text-[#4a4a44]'}`}>
                    {getIcon(item.category)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-mono font-bold">
                        {item.name} {item.quantity && item.quantity > 1 && <span className="text-[#4ade80] ml-1">x{item.quantity}</span>}
                      </h3>
                      {isEquipped(item) && (
                        <span className="text-[10px] bg-[#4ade80] text-black px-1 font-bold rounded">EQUIPPED</span>
                      )}
                    </div>
                    <p className="text-[#888] text-xs font-mono line-clamp-1">{item.description}</p>
                  </div>

                  <div className="text-right font-mono text-xs mr-4">
                    <div className="text-white">{(item.weight * (item.quantity || 1)).toFixed(1)} lbs</div>
                    <div className="text-[#4ade80]">${item.value * (item.quantity || 1)}</div>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(item.category === 'weapon' || item.category === 'armor') && (
                      <button 
                        onClick={() => onEquip(item)}
                        className={`p-2 border border-[#4a4a44] hover:border-[#4ade80] hover:text-[#4ade80] transition-colors ${isEquipped(item) ? 'text-[#4ade80] border-[#4ade80]' : 'text-white'}`}
                        title={isEquipped(item) ? 'Unequip' : 'Equip'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {item.category === 'chem' && (
                      <button 
                        onClick={() => onUse(item)}
                        className="p-2 border border-[#4a4a44] hover:border-[#4ade80] hover:text-[#4ade80] text-white transition-colors"
                        title="Use"
                      >
                        <FlaskConical className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => onDrop(item)}
                      disabled={item.category === 'quest'}
                      className={`p-2 border border-[#4a4a44] transition-colors ${item.category === 'quest' ? 'opacity-20 cursor-not-allowed' : 'hover:border-red-500 hover:text-red-500 text-white'}`}
                      title={item.category === 'quest' ? 'Cannot drop quest items' : 'Drop'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t-2 border-[#4a4a44] bg-[#2a2a24] text-[#4ade80] font-mono text-[10px] uppercase flex justify-between">
            <span>Vault-Tec Industries™</span>
            <span>Inventory Management System v2.0</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

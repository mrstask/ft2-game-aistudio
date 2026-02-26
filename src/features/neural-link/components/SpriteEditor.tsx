import React from 'react';
import { Entity } from '../../../game/types';
import { X, RefreshCw, Image as ImageIcon, Search, User, Shield, Zap, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SpriteEditorProps {
  entities: Entity[];
  onClose: () => void;
  onUpdateSprite: (entityId: string, spriteUrl: string) => void;
  onUpdateEntity: (entityId: string, updates: Partial<Entity>) => void;
  onRegenerate: (entityId: string) => void;
  isGenerating: boolean;
}

export const SpriteEditor: React.FC<SpriteEditorProps> = ({ 
  entities, 
  onClose, 
  onUpdateSprite, 
  onUpdateEntity,
  onRegenerate,
  isGenerating 
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredEntities = entities.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.subType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col p-8"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b-2 border-[#4ade80]/30 pb-4">
        <div className="flex items-center gap-4">
          <ImageIcon className="w-10 h-10 text-[#4ade80]" />
          <div>
            <h1 className="text-[#4ade80] font-mono text-3xl uppercase font-black tracking-tighter">Neural Link Asset Manager</h1>
            <p className="text-[#4ade80]/60 font-mono text-xs uppercase">Vault-Tec Sprite Database v2.4.1</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 border-2 border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80] hover:text-black transition-all"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4ade80]/40 w-5 h-5" />
          <input 
            type="text"
            placeholder="SEARCH ENTITY DATABASE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border-2 border-[#4ade80]/20 p-4 pl-12 text-[#4ade80] font-mono uppercase focus:border-[#4ade80] outline-none transition-all"
          />
        </div>
        <div className="bg-[#4ade80]/10 border-2 border-[#4ade80]/20 px-6 flex items-center gap-4">
          <span className="text-[#4ade80]/60 font-mono text-xs uppercase">Total Assets:</span>
          <span className="text-[#4ade80] font-mono text-xl font-bold">{entities.length}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-[#4ade80]/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEntities.map(entity => (
            <motion.div 
              key={entity.id}
              layout
              className="bg-[#1a1a1a] border-2 border-[#4ade80]/20 p-4 group hover:border-[#4ade80] transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-mono font-bold uppercase truncate">{entity.name}</h3>
                  <p className="text-[#4ade80]/40 font-mono text-[10px] uppercase">{entity.subType || 'Unknown Type'}</p>
                </div>
                <div className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase ${entity.type === 'player' ? 'bg-blue-900 text-blue-200' : 'bg-red-900 text-red-200'}`}>
                  {entity.type}
                </div>
              </div>

              <div className="aspect-square bg-black border border-[#4ade80]/10 rounded mb-4 flex items-center justify-center relative overflow-hidden">
                {entity.spriteUrl ? (
                  <img 
                    src={entity.spriteUrl} 
                    alt={entity.name} 
                    className="w-full h-full object-contain pixelated"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#4ade80]/20">
                    <User className="w-12 h-12" />
                    <span className="text-[8px] font-mono uppercase">No Visual Data</span>
                  </div>
                )}
                
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-[#4ade80] animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[#4ade80]/40 font-mono text-[8px] uppercase mb-1 block">Locomotion</label>
                    <select 
                      value={entity.movementType || 'bipedal'}
                      onChange={(e) => onUpdateEntity(entity.id, { movementType: e.target.value as any })}
                      className="w-full bg-black border border-[#4ade80]/20 p-1 text-[#4ade80] font-mono text-[10px] outline-none"
                    >
                      <option value="bipedal">Bipedal</option>
                      <option value="quadrupedal">Quadrupedal</option>
                      <option value="mechanized">Mechanized</option>
                      <option value="crawling">Crawling</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[#4ade80]/40 font-mono text-[8px] uppercase mb-1 block">Scale</label>
                    <select 
                      value={entity.size || 'medium'}
                      onChange={(e) => onUpdateEntity(entity.id, { size: e.target.value as any })}
                      className="w-full bg-black border border-[#4ade80]/20 p-1 text-[#4ade80] font-mono text-[10px] outline-none"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="colossal">Colossal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[#4ade80]/40 font-mono text-[8px] uppercase mb-1 block">Neural Prompt</label>
                  <textarea 
                    value={entity.basePrompt || ''}
                    onChange={(e) => onUpdateEntity(entity.id, { basePrompt: e.target.value })}
                    rows={2}
                    className="w-full bg-black border border-[#4ade80]/20 p-2 text-[#4ade80] font-mono text-[10px] outline-none focus:border-[#4ade80] transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-[#4ade80]/40 font-mono text-[8px] uppercase mb-1 block">Asset Source URL</label>
                  <input 
                    type="text"
                    value={entity.spriteUrl || ''}
                    onChange={(e) => onUpdateSprite(entity.id, e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-black border border-[#4ade80]/20 p-2 text-[#4ade80] font-mono text-[10px] outline-none focus:border-[#4ade80] transition-all"
                  />
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => onRegenerate(entity.id)}
                    disabled={isGenerating}
                    className="flex-1 py-2 bg-[#4ade80]/10 border border-[#4ade80] text-[#4ade80] font-mono text-[10px] uppercase font-bold hover:bg-[#4ade80] hover:text-black transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                    Sync
                  </button>
                  <button 
                    onClick={() => onUpdateSprite(entity.id, '')}
                    className="px-3 py-2 border border-red-900 text-red-500 font-mono text-[10px] uppercase hover:bg-red-900 hover:text-white transition-all"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

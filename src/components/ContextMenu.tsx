import React from 'react';
import { MapObject } from '../game/types';

interface ContextMenuProps {
  x: number;
  y: number;
  object: MapObject;
  onAction: (action: 'toggle' | 'lock' | 'picklock') => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, object, onAction, onClose }) => {
  return (
    <div 
      className="fixed z-50 bg-[#1a1a1a] border-2 border-[#4a4a44] p-1 shadow-2xl font-mono text-xs uppercase"
      style={{ left: x, top: y }}
      onMouseLeave={onClose}
    >
      <div className="px-3 py-1 border-b border-[#4a4a44] text-[#4ade80] mb-1">
        {object.name}
      </div>
      
      <button 
        onClick={() => onAction('toggle')}
        className="w-full text-left px-3 py-2 hover:bg-[#4a4a44] text-white transition-colors flex justify-between gap-4"
      >
        <span>{object.isOpen ? 'Close' : 'Open'}</span>
        <span className="opacity-50">O</span>
      </button>

      <button 
        onClick={() => onAction('lock')}
        className="w-full text-left px-3 py-2 hover:bg-[#4a4a44] text-white transition-colors flex justify-between gap-4"
      >
        <span>{object.isLocked ? 'Unlock' : 'Lock'}</span>
        <span className="opacity-50">L</span>
      </button>

      {!object.isOpen && object.isLocked && (
        <button 
          onClick={() => onAction('picklock')}
          className="w-full text-left px-3 py-2 hover:bg-[#4a4a44] text-white transition-colors flex justify-between gap-4"
        >
          <span>Pick Lock</span>
          <span className="opacity-50">P</span>
        </button>
      )}
    </div>
  );
};

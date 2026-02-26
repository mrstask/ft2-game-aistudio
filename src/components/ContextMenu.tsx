import React from 'react';

export interface ContextMenuAction {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

interface ContextMenuProps {
  x: number;
  y: number;
  title: string;
  actions: ContextMenuAction[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, title, actions, onClose }) => {
  return (
    <div 
      className="fixed z-50 bg-[#1a1a1a] border-2 border-[#4a4a44] p-1 shadow-2xl font-mono text-xs uppercase min-w-[120px]"
      style={{ left: x, top: y }}
      onMouseLeave={onClose}
    >
      <div className="px-3 py-1 border-b border-[#4a4a44] text-[#4ade80] mb-1 font-bold">
        {title}
      </div>
      
      {actions.map((action, index) => (
        <button 
          key={index}
          onClick={() => {
            action.onClick();
            onClose();
          }}
          disabled={action.disabled}
          className={`w-full text-left px-3 py-2 hover:bg-[#4a4a44] transition-colors flex justify-between gap-4 disabled:opacity-30 ${
            action.variant === 'danger' ? 'text-red-500' : 'text-white'
          }`}
        >
          <span>{action.label}</span>
          {action.shortcut && <span className="opacity-50">{action.shortcut}</span>}
        </button>
      ))}
    </div>
  );
};

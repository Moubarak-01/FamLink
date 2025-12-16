// components/chat/ReactionPicker.tsx
import React from 'react';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  // Handler to open the full emoji selection when the '+' button is clicked
  onOpenFullPicker: () => void; 
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, onOpenFullPicker }) => {
  return (
    <div className="absolute bottom-full mb-2 bg-[var(--bg-card)] shadow-lg rounded-full px-3 py-2 flex gap-2 border border-[var(--border-color)] animate-fade-in-up z-20">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={(e) => { e.stopPropagation(); onSelect(emoji); }}
          className="hover:scale-125 transition-transform text-lg leading-none"
        >
          {emoji}
        </button>
      ))}
      
      {/* IMPLEMENTATION: Plus Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onOpenFullPicker(); }}
        className="text-gray-500 hover:text-[var(--accent-primary)] hover:scale-125 transition-transform text-lg leading-none font-bold ml-1"
        title="More Emojis"
      >
        +
      </button>
    </div>
  );
};

export default ReactionPicker;
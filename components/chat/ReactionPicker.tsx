// components/chat/ReactionPicker.tsx
import React from 'react';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect }) => {
  return (
    <div className="absolute bottom-full mb-2 bg-[var(--bg-card)] shadow-lg rounded-full px-3 py-2 flex gap-2 border border-[var(--border-color)] animate-fade-in-up z-20">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="hover:scale-125 transition-transform text-lg leading-none"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default ReactionPicker;
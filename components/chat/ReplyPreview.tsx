// components/chat/ReplyPreview.tsx
import React from 'react';
import { ChatMessage } from '../../types';

interface ReplyPreviewProps {
  replyToId: string;
  messages: ChatMessage[];
  onCancel: () => void;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ replyToId, messages, onCancel }) => {
  const referencedMsg = messages.find(m => m.id === replyToId);

  if (!referencedMsg) return null;

  return (
    <div className="flex items-center justify-between bg-[var(--bg-card-subtle)] p-2 rounded-t-lg border-t border-l border-r border-[var(--border-color)] mx-3 mt-2 mb-0 animate-slide-up">
      <div className="border-l-4 border-[var(--accent-primary)] pl-2 max-w-[90%]">
        <p className="text-xs font-bold text-[var(--accent-primary)] mb-0.5">{referencedMsg.senderName}</p>
        <p className="text-xs text-[var(--text-secondary)] line-clamp-1 overflow-hidden text-ellipsis">
          {referencedMsg.deleted ? '🚫 Message deleted' : (referencedMsg.plaintext || 'Decryption failed')}
        </p>
      </div>
      <button onClick={onCancel} className="text-gray-500 hover:text-red-500 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
        ✕
      </button>
    </div>
  );
};

export default ReplyPreview;
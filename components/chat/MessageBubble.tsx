import React, { useState } from 'react';
import { ChatMessage, User } from '../../types';
import ReactionPicker from './ReactionPicker';

interface MessageBubbleProps {
  message: ChatMessage;
  currentUser: User;
  onReaction: (msgId: string, emoji: string) => void;
  onRemoveReaction: (msgId: string, emoji: string) => void;
  onReply: (msgId: string) => void;
  onDelete: (msgId: string) => void;
  onScrollToMessage: (msgId: string) => void;
  messages: ChatMessage[];
}

// Comprehensive emoji list to simulate a full picker
const FULL_EMOJI_LIST = [
    '😀', '😁', '😂', '🤣', '😅', '😆', '😊', '😋', '😎', '😍',
    '😘', '😗', '😙', '😚', '🙂', '🤗', '🤔', '😮', '😥', '😭',
    '😩', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😷', '🤒',
    '🤕', '🤢', '🤧', '😇', '🤠', '🥳', '🤯', '🤫', '🤭', '🧐',
    '🤓', '🤩', '🥳', '😎', '😒', '😞', '😟', '😠', '😡', '🤬',
    '🥺', '😳', '😱', '😨', '😰', '😢', '😥', '😓', '😭', '😫',
    '🤣', '😂', '😅', '😆', '😁', '😀', '🥲', '🫠', '🫠', '🫠'
];

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUser, onReaction, onRemoveReaction, onReply, onDelete, onScrollToMessage, messages }) => {
  const isMe = message.senderId === currentUser.id;
  const [showActions, setShowActions] = useState(false);
  // NEW STATE: To control the visibility of the full emoji picker
  const [showFullPicker, setShowFullPicker] = useState(false); 
  
  // Resolve Reply Context
  const replyContext = message.replyTo ? messages.find(m => m.id === message.replyTo) : null;

  const handleReactionClick = (emoji: string) => {
    setShowActions(false);
    setShowFullPicker(false); // Close full picker after selection
    onReaction(message.id, emoji);
  };

  const toggleReaction = (emoji: string) => {
      const hasReacted = message.reactions?.some(r => r.userId === currentUser.id && r.emoji === emoji);
      if (hasReacted) {
          onRemoveReaction(message.id, emoji);
      } else {
          onReaction(message.id, emoji);
      }
  }

  const reactionCounts = (message.reactions || []).reduce((acc: {[key:string]: number}, curr) => {
      acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
      return acc;
  }, {});

  const handleBubbleClick = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.reaction-pill')) return;
      setShowActions(!showActions);
      setShowFullPicker(false); // Reset full picker when opening the action menu
  };
  
  // NEW HANDLER: Opens the full emoji selection
  const handleOpenFullPicker = () => {
      setShowActions(false);
      setShowFullPicker(true);
  };
  
  // Handler to close the full picker manually
  const handleCloseFullPicker = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setShowFullPicker(false);
  };

  const avatarUrl = message.senderPhoto || `https://i.pravatar.cc/150?u=${message.senderId}`;

  // IMPLEMENTATION: Set dynamic width (85% for self, 95% for others)
  const bubbleMaxWidth = isMe ? 'max-w-[85%]' : 'max-w-[95%]';
  // IMPLEMENTATION: Add CSS hook class for the tail on user messages
  const tailClass = isMe ? 'user-bubble-tail' : 'other-bubble-tail';

  return (
    <div 
        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-6 relative group`}
        onMouseLeave={() => { setShowActions(false); if (!showFullPicker) setShowActions(false); }} // Keep open if full picker is active
    >
      {/* Sender Name (Group Chat) */}
      {!isMe && (
          <div className="flex items-center gap-2 mb-1 ml-1">
              <img src={avatarUrl} alt="avatar" className="w-5 h-5 rounded-full object-cover" />
              <span className="text-xs text-gray-500 font-medium">{message.senderName}</span>
          </div>
      )}

      <div className={`relative ${bubbleMaxWidth} min-w-[120px] ${showActions || showFullPicker ? 'z-20' : 'z-0'}`}>
        
        {/* Reply Context */}
        {replyContext && (
            <div 
                onClick={(e) => { e.stopPropagation(); onScrollToMessage(replyContext.id); }}
                className={`mb-1 p-1.5 rounded cursor-pointer text-xs border-l-4 bg-black/5 dark:bg-white/10 ${isMe ? 'border-green-600' : 'border-[var(--accent-primary)]'} hover:bg-black/10 dark:hover:bg-white/20 transition-colors`}
            >
                <p className="font-bold opacity-90">{replyContext.senderName}</p>
                <p className="opacity-70 line-clamp-1 text-[11px]">
                    {replyContext.deleted ? '🚫 Message deleted' : replyContext.plaintext}
                </p>
            </div>
        )}

        {/* Main Bubble */}
        <div 
            // IMPLEMENTATION: Use neutral rounding classes, and add the CSS hook class
            className={`p-3 rounded-lg shadow-sm text-sm relative cursor-pointer transition-colors ${tailClass}
            ${isMe ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-800 dark:text-gray-100' : 'bg-white dark:bg-[#202c33] text-gray-800 dark:text-gray-100'}
            ${message.deleted ? 'italic opacity-70' : ''}`}
            onClick={handleBubbleClick}
            onContextMenu={(e) => { e.preventDefault(); setShowActions(true); }}
        >
            <p className="break-words whitespace-pre-wrap leading-relaxed select-text">
                {message.deleted ? "🚫 This message was deleted" : message.plaintext}
            </p>
            
            <div className="flex justify-end items-center gap-1 mt-1 select-none">
                <span className="text-[10px] opacity-60">
                    {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
                {isMe && !message.deleted && (
                    <span className={`text-[10px] font-bold ${message.status === 'seen' ? 'text-blue-500' : 'opacity-60'}`}>
                        {message.status === 'seen' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
                    </span>
                )}
            </div>

            {/* Reaction Bar Pill */}
            {Object.keys(reactionCounts).length > 0 && (
                 <div className="absolute -bottom-3 right-0 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full px-1.5 py-0.5 flex items-center gap-1 shadow-sm z-10 reaction-pill">
                     {Object.entries(reactionCounts).map(([emoji, count]) => (
                         <button 
                            key={emoji} 
                            className="text-xs flex items-center hover:scale-110 transition-transform" 
                            onClick={(e) => { e.stopPropagation(); toggleReaction(emoji); }}
                         >
                             {emoji} <span className="text-[10px] ml-0.5 text-[var(--text-secondary)]">{count > 1 ? count : ''}</span>
                         </button>
                     ))}
                 </div>
            )}
        </div>

        {/* --- UI CONTROLS --- */}
        {showActions && !message.deleted && !showFullPicker && (
            <>
                {/* 1. Action Menu (Reply/Delete) - UP */}
                <div className={`absolute ${isMe ? 'right-0' : 'left-0'} -top-12 z-30 flex flex-col items-${isMe ? 'end' : 'start'}`}>
                    <div className="bg-[var(--bg-card)] shadow-xl rounded-lg border border-[var(--border-color)] overflow-hidden flex flex-col mt-1 min-w-[140px] animate-fade-in">
                        <button onClick={() => { onReply(message.id); setShowActions(false); }} className="px-4 py-2 text-left text-sm hover:bg-[var(--bg-hover)] text-[var(--text-primary)] flex items-center gap-2">
                            <span>↩</span> Reply
                        </button>
                        {isMe && (
                            <button onClick={() => { onDelete(message.id); setShowActions(false); }} className="px-4 py-2 text-left text-sm text-red-500 hover:bg-[var(--bg-hover)] flex items-center gap-2">
                                <span>🗑</span> Delete
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. Reaction Picker - DOWN (Standard) */}
                <div className={`absolute ${isMe ? 'right-0' : 'left-0'} top-full mt-2 z-30`}>
                     <ReactionPicker onSelect={handleReactionClick} onOpenFullPicker={handleOpenFullPicker} />
                </div>
            </>
        )}
        
        {/* IMPLEMENTATION: Full Emoji Picker (Expanded, Scrollable, Simulated) */}
        {showFullPicker && (
            <div className={`absolute ${isMe ? 'right-0' : 'left-0'} top-full mt-2 z-30 w-64 bg-[var(--bg-card)] shadow-2xl rounded-xl border border-[var(--border-color)] p-3 animate-fade-in`}>
                <div className='flex justify-between items-center mb-2'>
                    <h4 className='font-semibold text-sm'>Select Any Emoji</h4>
                    <button onClick={handleCloseFullPicker} className='text-lg hover:text-red-500'>&times;</button>
                </div>
                {/* Scrollable Container */}
                <div className='h-48 overflow-y-auto grid grid-cols-6 gap-2'>
                    {FULL_EMOJI_LIST.map((emoji) => (
                        <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReactionClick(emoji); }} className='p-1 hover:bg-[var(--bg-hover)] rounded text-xl'>
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
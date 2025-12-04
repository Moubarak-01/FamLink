import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Activity, User, SharedOuting, SkillRequest, BookingRequest, ChatMessage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { socketService } from '../services/socketService';
import { chatService } from '../services/chatService';

interface ChatModalProps {
  activity?: Activity;
  outing?: SharedOuting;
  skillRequest?: SkillRequest;
  bookingRequest?: BookingRequest;
  currentUser: User;
  onClose: () => void;
  onSendMessage: (id: string, messageText: string) => void;
  onDeleteMessage: (id: string, messageId: string) => void;
  onDeleteAllMessages: (id: string) => void;
  onReportUser?: (userId: string) => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ activity, outing, skillRequest, bookingRequest, currentUser, onClose, onSendMessage, onDeleteMessage, onDeleteAllMessages }) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [historyMessages, setHistoryMessages] = useState<ChatMessage[]>([]);
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const contextItem = activity || outing || skillRequest || bookingRequest;
  const contextId = contextItem?.id || '';
  
  // --- 1. Determine "Other Person" Correctly ---
  let otherUserId = '';
  let otherUserName = '';
  let otherUserPhoto = '';

  if (bookingRequest) {
      const isParent = currentUser.id === bookingRequest.parentId;
      // If I am the parent, I see the Nanny. If I am the Nanny, I see the Parent.
      otherUserId = isParent ? bookingRequest.nannyId : bookingRequest.parentId;
      otherUserName = isParent ? (bookingRequest.nannyName || 'Nanny') : (bookingRequest.parentName || 'Parent');
      // Safe access to photos
      otherUserPhoto = isParent ? (bookingRequest.nannyPhoto || '') : (bookingRequest['parentPhoto'] || bookingRequest.parent?.photo || ''); 
  } else if (skillRequest) {
      otherUserId = skillRequest.requesterId === currentUser.id ? '' : skillRequest.requesterId;
      otherUserName = skillRequest.requesterName;
      otherUserPhoto = skillRequest.requesterPhoto;
  } else if (outing) {
      otherUserId = outing.hostId;
      otherUserName = outing.hostName;
      otherUserPhoto = outing.hostPhoto;
  } else if (activity) {
      otherUserId = activity.hostId;
      otherUserName = activity.hostName;
      otherUserPhoto = activity.hostPhoto;
  }

  // --- 2. Merge & Sort Messages ---
  const realtimeMessages = contextItem?.messages || [];
  const allMessages = useMemo(() => {
      const combined = [...historyMessages, ...realtimeMessages];
      const unique = new Map();
      combined.forEach(msg => { if (msg && msg.id) unique.set(msg.id, msg); });
      return Array.from(unique.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }, [historyMessages, realtimeMessages]);

  // --- 3. Socket & History Setup ---
  useEffect(() => {
      if (contextId) {
          chatService.getHistory(contextId).then(setHistoryMessages).catch(console.error);
          socketService.joinRoom(contextId, currentUser.id);
          
          if (otherUserId) {
              socketService.checkOnlineStatus(otherUserId, (isOnline) => setIsRecipientOnline(isOnline));
          }
      }
  }, [contextId, currentUser.id, otherUserId]);

  // --- 4. Real-time Listeners ---
  useEffect(() => {
      const unsubStatus = socketService.onStatusUpdate((data) => {
          if (data.roomId === contextId) {
              setHistoryMessages(prev => prev.map(msg => {
                  // Bulk update: If someone saw the room, mark MY sent messages as seen
                  if (data.status === 'seen' && msg.senderId === currentUser.id && msg.status !== 'seen') {
                       return { ...msg, status: 'seen' };
                  }
                  // Single update
                  if (msg.id === data.messageId) {
                      return { ...msg, status: data.status };
                  }
                  return msg;
              }));
          }
      });

      const unsubPresence = socketService.onPresenceUpdate(({ userId, status }) => {
          if (userId === otherUserId) setIsRecipientOnline(status === 'online');
      });

      return () => {
          unsubStatus();
          unsubPresence();
          if (contextId) socketService.leaveRoom(contextId);
      };
  }, [contextId, otherUserId, currentUser.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // --- 5. WhatsApp Ticks Component ---
  const renderStatusTicks = (status: string) => {
      if (status === 'seen') return <span className="text-blue-500 text-[11px] ml-1 font-bold tracking-tighter">✓✓</span>;
      if (status === 'delivered') return <span className="text-gray-500 text-[11px] ml-1 font-bold tracking-tighter">✓✓</span>;
      return <span className="text-gray-400 text-[11px] ml-1 font-bold">✓</span>;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim()) {
      onSendMessage(contextId, message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const getSenderPhoto = (photo?: string, id?: string) => photo || `https://i.pravatar.cc/150?img=${id ? id.charCodeAt(0) % 70 : 0}`;

  return (
    <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex justify-between items-center z-10">
            <div className="flex items-center gap-3 overflow-hidden">
                {otherUserId && <img src={getSenderPhoto(otherUserPhoto, otherUserId)} className="w-10 h-10 rounded-full object-cover border border-gray-200" alt={otherUserName} />}
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] truncate">{otherUserName || t('chat_modal_title')}</h2>
                    {otherUserId && (
                        <p className={`text-xs font-medium flex items-center gap-1 ${isRecipientOnline ? 'text-green-500' : 'text-gray-400'}`}>
                             <span className={`w-2 h-2 rounded-full ${isRecipientOnline ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                             {isRecipientOnline ? 'Online' : 'Offline'}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {/* Clear Chat Button */}
                {allMessages.length > 0 && (
                    <button 
                        onClick={() => { if(window.confirm("Clear entire chat history?")) onDeleteAllMessages(contextId); }} 
                        className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Clear Chat"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                )}
                <button onClick={onClose} className="text-2xl leading-none text-gray-500 hover:text-gray-700 px-2">&times;</button>
            </div>
        </div>
        
        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto bg-[#e5ded8] dark:bg-[#1f2937] space-y-2 scrollbar-thin">
            {allMessages.map((msg, index) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                    <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative items-center`}>
                        
                        {/* Delete Message Button (visible on hover for own messages) */}
                        {isMe && (
                            <button 
                                onClick={() => { if(window.confirm("Delete this message?")) onDeleteMessage(contextId, msg.id); }}
                                className="hidden group-hover:flex text-gray-400 hover:text-red-500 mr-2 opacity-50 hover:opacity-100 transition-opacity"
                                title="Delete"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        )}

                        <div className={`relative max-w-[75%] p-2 px-3 rounded-lg shadow-sm text-sm ${isMe ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                            <p className="break-words whitespace-pre-wrap leading-relaxed pr-2">{msg.text}</p>
                            <div className="flex justify-end items-center gap-1 mt-1 select-none">
                                <span className="text-[10px] text-gray-500">
                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                                {/* TICKS: Strictly only show if I sent the message */}
                                {isMe && renderStatusTicks(msg.status)}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                <textarea ref={textareaRef} value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder={t('chat_placeholder')} rows={1} className="flex-1 px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-full shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none min-h-[45px]" />
                <button type="submit" disabled={!message.trim()} className="bg-[var(--accent-primary)] text-white p-3 rounded-full shadow-md disabled:opacity-50 transition-transform hover:scale-105 active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
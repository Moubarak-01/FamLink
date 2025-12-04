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

const ChatModal: React.FC<ChatModalProps> = ({ activity, outing, skillRequest, bookingRequest, currentUser, onClose, onSendMessage, onDeleteMessage, onDeleteAllMessages, onReportUser }) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [historyMessages, setHistoryMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const contextItem = activity || outing || skillRequest || bookingRequest;
  const contextId = contextItem?.id || '';
  
  // Chat Permission Check
  let isChatDisabled = false;
  let disabledReason = '';
  if (bookingRequest && bookingRequest.status !== 'accepted') {
      isChatDisabled = true;
      disabledReason = "Booking must be accepted to chat.";
  }

  const realtimeMessages = contextItem?.messages || [];
  
  const allMessages = useMemo(() => {
      const combined = [...historyMessages, ...realtimeMessages];
      const unique = new Map();
      combined.forEach(msg => {
          if (msg && msg.id) {
              unique.set(msg.id, msg);
          }
      });
      return Array.from(unique.values()).sort((a, b) => {
          const dateA = new Date(a.timestamp || Date.now()).getTime();
          const dateB = new Date(b.timestamp || Date.now()).getTime();
          return dateA - dateB;
      });
  }, [historyMessages, realtimeMessages]);

  let title = '';
  let description = '';

  if (activity) {
      title = t('chat_modal_title');
      description = activity.description;
  } else if (outing) {
      title = outing.title;
      description = outing.description;
  } else if (skillRequest) {
      title = skillRequest.title;
      description = skillRequest.description;
  } else if (bookingRequest) {
      const isParent = currentUser.id === bookingRequest.parentId;
      title = `Chat with ${isParent ? (bookingRequest.nannyName || 'Nanny') : bookingRequest.parentName}`;
      description = `Booking on ${new Date(bookingRequest.date).toLocaleDateString()}`;
  }

  useEffect(() => {
      const fetchHistory = async () => {
          if (contextId) {
              setIsLoadingHistory(true);
              try {
                  const history = await chatService.getHistory(contextId);
                  setHistoryMessages(history);
              } catch (error) {
                  console.error("Failed to fetch chat history", error);
              } finally {
                  setIsLoadingHistory(false);
              }
          }
      };
      fetchHistory();
  }, [contextId]);

  useEffect(() => {
      if (contextId) {
          socketService.joinRoom(contextId, currentUser.id);
      }
      
      // Listen for status updates to update history messages dynamically
      const unsubscribeStatus = socketService.onStatusUpdate((data) => {
          if (data.roomId === contextId) {
              // Update local history state if the message exists there
              setHistoryMessages(prev => prev.map(msg => {
                  if (data.status === 'seen') {
                       // If 'seen' event, mark all other user's messages as seen (logic usually handled by backend, here we just update specific or all)
                       if (msg.senderId !== data.userId && msg.status !== 'seen') {
                           return { ...msg, status: 'seen' };
                       }
                  }
                  if (msg.id === data.messageId) {
                      return { ...msg, status: data.status };
                  }
                  return msg;
              }));
          }
      });

      return () => {
          unsubscribeStatus();
          if (contextId) {
              socketService.leaveRoom(contextId);
          }
      };
  }, [contextId, currentUser.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  // Feature: Render Double Ticks
  const renderStatusTicks = (status: string) => {
      if (status === 'seen') {
          return <span className="text-blue-500 text-[10px] ml-1 font-bold">✓✓</span>; // Blue double tick
      } else if (status === 'delivered') {
          return <span className="text-gray-400 text-[10px] ml-1 font-bold">✓✓</span>; // Gray double tick
      }
      return <span className="text-gray-400 text-[10px] ml-1 font-bold">✓</span>; // Gray single tick (sent)
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && !isChatDisabled) {
      onSendMessage(contextId, message.trim());
      setMessage('');
      setHasSent(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getSenderName = (name?: string) => (name || 'Unknown').split(' ')[0];
  const getSenderPhoto = (photo?: string, id?: string) => {
      if (photo) return photo;
      const numId = id ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 70 : 0;
      return `https://i.pravatar.cc/150?img=${numId}`;
  };

  return (
    <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex justify-between items-center z-10">
            <div className="flex-1 overflow-hidden">
                <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">{title}</h2>
                <p className="text-sm text-[var(--text-light)] truncate max-w-[80%]">{description}</p>
            </div>
             <div className="flex items-center gap-1">
                <button onClick={onClose} className="text-[var(--text-light)] hover:text-[var(--text-primary)] p-2 rounded-full hover:bg-[var(--bg-hover)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
             </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-[var(--bg-card-subtle)] space-y-4 scrollbar-thin scrollbar-thumb-gray-300">
            {allMessages.length > 0 ? (
                allMessages.map((msg, index) => {
                    if (!msg) return null;
                    const isCurrentUser = msg.senderId === currentUser.id;
                    return (
                        <div key={msg.id || index} className={`flex items-end gap-2 group ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            {!isCurrentUser && <img src={getSenderPhoto(msg.senderPhoto, msg.senderId)} alt={msg.senderName} className="w-8 h-8 rounded-full object-cover" />}
                            <div className="relative max-w-[75%]">
                                <div className={`p-3 shadow-sm text-sm relative ${isCurrentUser ? 'bg-[var(--accent-primary)] text-white rounded-2xl rounded-br-none' : 'bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] rounded-2xl rounded-bl-none'}`}>
                                    {!isCurrentUser && <p className="text-xs font-bold text-[var(--accent-secondary)] mb-1">{getSenderName(msg.senderName)}</p>}
                                    <p className="break-words whitespace-pre-wrap leading-relaxed">{msg.text || ''}</p>
                                    <div className={`text-[10px] mt-1 text-right opacity-70 ${isCurrentUser ? 'text-white' : 'text-[var(--text-light)]'} flex justify-end items-center gap-1`}>
                                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        {isCurrentUser && renderStatusTicks(msg.status || 'sent')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-light)] opacity-60">
                    <p className="text-sm">No messages yet.</p>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
             {isChatDisabled ? (
                 <div className="text-center p-2 bg-yellow-50 text-yellow-700 text-sm rounded-lg border border-yellow-200">
                     {disabledReason}
                 </div>
             ) : (
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('chat_placeholder')}
                        rows={1}
                        className="flex-1 px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] text-[var(--text-primary)] resize-none overflow-y-auto min-h-[48px] max-h-[150px]"
                        autoFocus
                    />
                    <button type="submit" disabled={!message.trim()} className={`bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white p-3 rounded-full shadow-md ${!message.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.5 12l19-9-9 19-2-8-8-2z" transform="rotate(-45 12 12)" /></svg>
                    </button>
                </form>
             )}
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
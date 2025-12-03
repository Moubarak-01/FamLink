
import React, { useState, useRef, useEffect } from 'react';
import { Activity, User, SharedOuting, SkillRequest, BookingRequest } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { socketService } from '../services/socketService';

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
  const [hasSent, setHasSent] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Determine which context we are in
  const contextItem = activity || outing || skillRequest || bookingRequest;
  const contextId = contextItem?.id || '';
  const messages = contextItem?.messages || [];
  
  const isHost = activity ? activity.hostId === currentUser.id : 
                 outing ? outing.hostId === currentUser.id : 
                 skillRequest ? skillRequest.requesterId === currentUser.id : 
                 bookingRequest ? bookingRequest.parentId === currentUser.id : false;

  let title = '';
  let description = '';
  let targetUserIdForReport = '';

  if (activity) {
      title = t('chat_modal_title');
      description = activity.description;
      targetUserIdForReport = activity.hostId === currentUser.id ? '' : activity.hostId; 
  } else if (outing) {
      title = outing.title;
      description = outing.description;
      targetUserIdForReport = outing.hostId;
  } else if (skillRequest) {
      title = skillRequest.title;
      description = skillRequest.description;
      targetUserIdForReport = skillRequest.requesterId;
  } else if (bookingRequest) {
      const isParent = currentUser.id === bookingRequest.parentId;
      title = `Chat with ${isParent ? (bookingRequest.nannyName || 'Nanny') : bookingRequest.parentName}`;
      description = `Booking on ${new Date(bookingRequest.date).toLocaleDateString()}`;
      targetUserIdForReport = isParent ? bookingRequest.nannyId : bookingRequest.parentId;
  }

  // Join the socket room when the modal opens
  useEffect(() => {
      if (contextId) {
          socketService.joinRoom(contextId);
      }
      return () => {
          if (contextId) {
              socketService.leaveRoom(contextId);
          }
      };
  }, [contextId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim()) {
      onSendMessage(contextId, message.trim());
      setMessage('');
      setHasSent(true);
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDelete = (e: React.MouseEvent, msgId: string) => {
      e.stopPropagation();
      e.preventDefault(); 
      
      if (window.confirm("Delete this message?")) {
          onDeleteMessage(contextId, msgId);
      }
  }

  const handleClearAll = () => {
      if (window.confirm("Are you sure you want to delete all messages in this chat? This action cannot be undone.")) {
          onDeleteAllMessages(contextId);
      }
  }

  const getRotationClass = () => {
      if (hasSent) return 'rotate-90'; 
      if (isHovered) return 'rotate-90';
      return 'rotate-0';
  };

  const formatTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex justify-between items-center z-10">
            <div className="flex-1 overflow-hidden">
                <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">{title}</h2>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-[var(--text-light)] truncate max-w-[80%]">{description}</p>
                </div>
            </div>
             <div className="flex items-center gap-1">
                {onReportUser && targetUserIdForReport && targetUserIdForReport !== currentUser.id && (
                    <button
                        onClick={() => {
                             if(window.confirm("Report this user for inappropriate behavior?")) {
                                onReportUser(targetUserIdForReport);
                             }
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors flex-shrink-0 mr-1"
                        title="Report User"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13a1 1 0 011-1h1.5a1 1 0 011 1v5a1 1 0 01-1 1H13a1 1 0 01-1-1V8z" />
                        </svg>
                    </button>
                )}

                {isHost && messages.length > 0 && (
                    <button 
                        onClick={handleClearAll} 
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0 mr-1"
                        title="Clear Chat"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
                 <button 
                    onClick={onClose}
                    className="text-[var(--text-light)] hover:text-[var(--text-primary)] p-2 rounded-full hover:bg-[var(--bg-hover)]"
                    title="Exit Chat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
             </div>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-[var(--bg-card-subtle)] space-y-4 scrollbar-thin scrollbar-thumb-gray-300">
            {messages.length > 0 ? (
                messages.map((msg, index) => {
                    const isCurrentUser = msg.senderId === currentUser.id;
                    return (
                        <div key={msg.id || index} className={`flex items-end gap-2 group ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                            {!isCurrentUser && <img src={msg.senderPhoto} alt={msg.senderName} className="w-8 h-8 rounded-full object-cover border border-[var(--border-color)]" />}
                            <div className="relative max-w-[75%]">
                                <div 
                                    className={`p-3 shadow-sm text-sm relative 
                                    ${isCurrentUser 
                                        ? 'bg-[var(--accent-primary)] text-white rounded-2xl rounded-br-none' 
                                        : 'bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] rounded-2xl rounded-bl-none'
                                    }`}
                                >
                                    {!isCurrentUser && <p className="text-xs font-bold text-[var(--accent-secondary)] mb-1">{msg.senderName.split(' ')[0]}</p>}
                                    <p className="break-words whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                    <div className={`text-[10px] mt-1 text-right opacity-70 ${isCurrentUser ? 'text-white' : 'text-[var(--text-light)]'}`}>
                                        {formatTime(msg.timestamp)}
                                    </div>
                                </div>
                                
                                {/* Delete Button for Individual Message */}
                                {isCurrentUser && (
                                    <button 
                                        type="button"
                                        onClick={(e) => handleDelete(e, msg.id)}
                                        className="absolute -top-2.5 -left-2.5 bg-white dark:bg-gray-700 text-red-500 border border-red-200 dark:border-red-900 rounded-full p-1.5 shadow-md hover:bg-red-50 dark:hover:bg-red-900/50 z-50 cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                                        title="Delete message"
                                        aria-label="Delete message"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                             {isCurrentUser && <img src={msg.senderPhoto} alt={msg.senderName} className="w-8 h-8 rounded-full object-cover border-2 border-[var(--accent-primary)]" />}
                        </div>
                    );
                })
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-light)] opacity-60">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm">No messages yet.</p>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('chat_placeholder')}
                    rows={1}
                    className="flex-1 px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring-accent)] text-[var(--text-primary)] resize-none overflow-y-auto min-h-[48px] max-h-[150px] transition-all"
                    autoFocus
                />
                <button 
                    type="submit" 
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className={`bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white p-3 rounded-full shadow-md group transition-all duration-300 flex-shrink-0 ${!message.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!message.trim()}
                    title="Send"
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-6 w-6 transform transition-transform duration-300 ease-in-out ${getRotationClass()}`} 
                        viewBox="0 0 24 24" 
                        fill="currentColor"
                    >
                         <path d="M2.5 12l19-9-9 19-2-8-8-2z" transform="rotate(-45 12 12)" />
                    </svg>
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;

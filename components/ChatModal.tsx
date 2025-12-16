import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Activity, User, SharedOuting, SkillRequest, BookingRequest, ChatMessage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { socketService } from '../services/socketService';
import { chatService } from '../services/chatService';
import MessageBubble from './chat/MessageBubble';
import ReplyPreview from './chat/ReplyPreview';

interface ChatModalProps {
  activity?: Activity;
  outing?: SharedOuting;
  skillRequest?: SkillRequest;
  bookingRequest?: BookingRequest;
  currentUser: User;
  onClose: () => void;
  onDeleteMessage: (contextId: string, messageId: string) => void;
  onDeleteAllMessages: (contextId: string) => void;
  onReportUser: (userId: string) => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ activity, outing, skillRequest, bookingRequest, currentUser, onClose, onDeleteMessage, onDeleteAllMessages, onReportUser }) => {
  const { t } = useLanguage();
  const [messageText, setMessageText] = useState('');
  const [historyMessages, setHistoryMessages] = useState<ChatMessage[]>([]);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  
  // New States for Online/Typing status
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);
  const [recipientLastSeen, setRecipientLastSeen] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to track the last time we sent a "typing" signal (prevents spamming)
  const lastTypingSentRef = useRef<number>(0);

  const contextItem = activity || outing || skillRequest || bookingRequest;
  const contextId = contextItem?.id || '';

  // --- Determine Title, Recipient ID, and PHOTO ---
  let title = t('chat_modal_title');
  let otherUserId = '';
  let otherUserPhoto = '';

  if (bookingRequest) {
      const isParent = currentUser.id === bookingRequest.parentId;
      otherUserId = isParent ? bookingRequest.nannyId : bookingRequest.parentId;
      title = isParent ? (bookingRequest.nannyName || 'Nanny') : (bookingRequest.parentName || 'Parent');
      otherUserPhoto = isParent ? (bookingRequest.nannyPhoto || '') : (bookingRequest['parentPhoto'] || '');
  } else if (skillRequest) {
      title = skillRequest.title;
      otherUserPhoto = skillRequest.image || skillRequest.requesterPhoto || '';
  } else if (outing) {
      title = outing.title;
      otherUserPhoto = outing.image || outing.hostPhoto || '';
  } else if (activity) {
      title = `${t(`activity_cat_${activity.category}`)} - Activity`;
      otherUserPhoto = activity.image || activity.hostPhoto || '';
  }

  const allMessages = useMemo(() => {
      // Filter out messages deleted "for me" locally
      return historyMessages
        .filter(m => !m.deletedFor?.includes(currentUser.id))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }, [historyMessages, currentUser.id]);

  useEffect(() => {
      if (contextId) {
          // 1. Reset typing status immediately when switching rooms
          setTypingUsers([]);
          
          chatService.getHistory(contextId).then(setHistoryMessages).catch(console.error);
          socketService.joinRoom(contextId, currentUser.id);
          
          if (bookingRequest && otherUserId) {
              socketService.checkOnlineStatus(otherUserId, (data) => {
                  if (data) {
                    setIsRecipientOnline(data.status === 'online');
                    setRecipientLastSeen(data.lastSeen || null);
                  }
              });
          }
      }

      const unsubMsg = socketService.onMessage(({ roomId, message }) => {
          if (roomId !== contextId) return;
          setHistoryMessages(prev => {
              if (prev.some(m => m.id === message.id)) return prev;
              return [...prev, message];
          });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });

      const unsubReaction = socketService.onReaction((data) => {
          if (data.roomId !== contextId) return;
          setHistoryMessages(prev => prev.map(m => {
              if (m.id === data.messageId) {
                  const reactions = m.reactions || [];
                  if (data.type === 'add') {
                      if (!reactions.some(r => r.userId === data.userId && r.emoji === data.emoji)) {
                          return { ...m, reactions: [...reactions, { userId: data.userId, emoji: data.emoji }] };
                      }
                  } else {
                      return { ...m, reactions: reactions.filter(r => !(r.userId === data.userId && r.emoji === data.emoji)) };
                  }
              }
              return m;
          }));
      });

      const unsubDelete = socketService.onMessageDeleted((data) => {
          if (data.roomId !== contextId) return;
          
          if (data.isLocalDelete) {
               setHistoryMessages(prev => prev.map(m => 
                   m.id === data.messageId 
                   ? { ...m, deletedFor: [...(m.deletedFor || []), currentUser.id] } 
                   : m
               ));
          } else {
               setHistoryMessages(prev => prev.map(m => 
                   m.id === data.messageId ? { ...m, deleted: true, plaintext: "🚫 This message was deleted" } : m
               ));
          }
      });

      const unsubClear = socketService.onChatCleared((data) => {
          if (data.roomId === contextId) {
              setHistoryMessages([]);
          }
      });

      const unsubPresence = socketService.onPresenceUpdate((data) => {
           if (data.userId === otherUserId) {
               setIsRecipientOnline(data.status === 'online');
               if (data.lastSeen) setRecipientLastSeen(data.lastSeen);
           }
      });

      const unsubStatus = socketService.onStatusUpdate((data) => {
          if (data.roomId === contextId) {
               setHistoryMessages(prev => prev.map(msg => {
                   if (data.status === 'seen' && msg.senderId !== data.userId) {
                        return { ...msg, status: 'seen' };
                   }
                   if (msg.id === data.messageId) return { ...msg, status: data.status };
                   return msg;
               }));
          }
      });
      
      // 2. Typing Listener with immediate State Update
      const unsubTyping = socketService.onTyping((data) => {
          if(data.roomId !== contextId || data.userId === currentUser.id) return;
          
          if (data.isTyping) {
              // Add user if not already there
              setTypingUsers(prev => prev.includes(data.userName) ? prev : [...prev, data.userName]);
          } else {
              // Remove user immediately - causes React to re-render instantly
              setTypingUsers(prev => prev.filter(name => name !== data.userName));
          }
      });

      return () => {
          unsubMsg(); unsubReaction(); unsubDelete(); unsubClear(); unsubPresence(); unsubStatus(); unsubTyping();
          if (contextId) {
              // UPDATED: Now sending currentUser.fullName so the server knows WHO stopped
              socketService.sendStopTyping(contextId, currentUser.id, currentUser.fullName); 
              socketService.leaveRoom(contextId);
          }
      };
  }, [contextId, currentUser.id, bookingRequest, otherUserId]);

  useEffect(() => {
    if (allMessages.length > 0) {
         messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [contextId]);

  // --- INSTANT TYPING LOGIC (Refined) ---

  const startTyping = () => {
      // 1. Always clear the "Stop" timer so the indicator doesn't vanish while you are active
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      // 2. Throttle: Only send the "I am typing" signal if 2 seconds have passed since the last one.
      const now = Date.now();
      if (now - lastTypingSentRef.current > 2000) {
          socketService.sendTyping(contextId, currentUser.id, currentUser.fullName);
          lastTypingSentRef.current = now;
      }
      
      // 3. Set a backup timer to stop typing if you fall asleep (3 seconds of silence)
      typingTimeoutRef.current = setTimeout(() => {
          stopTyping();
      }, 3000);
  };

  const stopTyping = () => {
      // Clear the timeout so we don't send a duplicate signal later
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      // Send "Stop" immediately - UPDATED to include userName
      socketService.sendStopTyping(contextId, currentUser.id, currentUser.fullName);
      
      // CRITICAL FIX: Reset the throttle timer. 
      lastTypingSentRef.current = 0;
  };

  // 1. On Focus: Start typing immediately
  const handleFocus = () => {
      startTyping();
  };

  // 2. On Blur: The "Trigger" - Stop typing immediately when focus is lost
  const handleBlur = () => {
      stopTyping();
  };

  // 3. On KeyDown: Refresh typing status
  const handleKeyDown = () => {
      startTyping();
  };

  // 4. Send Message: Clear typing immediately
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (messageText.trim()) {
      stopTyping(); // Stop typing immediately on send

      const tempId = `temp-${Date.now()}`;
      const newMessage: ChatMessage = {
          id: tempId,
          senderId: currentUser.id,
          senderName: currentUser.fullName,
          senderPhoto: currentUser.photo || '',
          text: messageText.trim(),
          plaintext: messageText.trim(),
          timestamp: Date.now(),
          status: 'sent',
          reactions: [],
          replyTo: replyToId || undefined,
          deleted: false,
          deletedFor: []
      };
      
      setHistoryMessages(prev => [...prev, newMessage]);
      
      socketService.sendMessage(contextId, newMessage, (savedMessage) => {
           setHistoryMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m));
      });
      
      setMessageText('');
      setReplyToId(null);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const handleDeleteClick = (msgId: string, isSender: boolean) => {
      const options = [];
      options.push("Delete for me");
      if (isSender) options.push("Delete for everyone");
      
      const choice = window.prompt(`Delete message? Type:\n1 for "Delete for me"\n${isSender ? '2 for "Delete for everyone"' : ''}`);
      
      if (choice === '1') {
          socketService.deleteMessage(contextId, msgId, currentUser.id, true);
      } else if (choice === '2' && isSender) {
          socketService.deleteMessage(contextId, msgId, currentUser.id, false);
      }
  };

  const scrollToMessage = (msgId: string) => {
      const element = document.getElementById(`msg-${msgId}`);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-yellow-100', 'dark:bg-yellow-900');
          setTimeout(() => element.classList.remove('bg-yellow-100', 'dark:bg-yellow-900'), 1000);
      }
  };

  const formatLastSeen = (dateStr: string) => {
      try {
          return new Date(dateStr).toLocaleString(undefined, {
              month: 'short', 
              day: 'numeric', 
              hour: 'numeric', 
              minute: 'numeric'
          });
      } catch { return ''; }
  };

  return (
    <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-lg h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex justify-between items-center z-10 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
                {otherUserId && (
                    <img 
                        src={otherUserPhoto || `https://i.pravatar.cc/150?u=${otherUserId}`} 
                        className="w-10 h-10 rounded-full object-cover border border-gray-200" 
                        alt="avatar" 
                    />
                )}
                <div className="min-w-0">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] truncate flex items-center gap-2">
                        {title}
                    </h2>
                    {bookingRequest && (
                        <p className="text-xs text-[var(--text-secondary)]">
                            {isRecipientOnline ? (
                                <span className="text-green-500 font-medium">● Online</span>
                            ) : recipientLastSeen ? (
                                <span>Last seen {formatLastSeen(recipientLastSeen)}</span>
                            ) : (
                                <span>Offline</span>
                            )}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex gap-3 items-center">
                <button onClick={onClose} className="text-2xl leading-none text-[var(--text-secondary)] hover:text-[var(--text-primary)]">&times;</button>
            </div>
        </div>
        
        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto bg-[#e5ded8] dark:bg-[#0b141a] scrollbar-thin">
            {allMessages.map((msg) => (
                <div id={`msg-${msg.id}`} key={msg.id} className="transition-colors duration-300 rounded-lg">
                    <MessageBubble 
                        message={msg} 
                        currentUser={currentUser} 
                        messages={allMessages}
                        onReaction={(id, emoji) => socketService.sendReaction(contextId, id, currentUser.id, emoji)}
                        onRemoveReaction={(id, emoji) => socketService.removeReaction(contextId, id, currentUser.id, emoji)}
                        onReply={(id) => setReplyToId(id)}
                        onDelete={(id) => handleDeleteClick(id, msg.senderId === currentUser.id)}
                        onScrollToMessage={scrollToMessage}
                    />
                </div>
            ))}
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
                <div className="text-xs text-gray-500 italic ml-2 mb-2 transition-opacity duration-200 opacity-100">
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
            )}
            
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-[var(--bg-card)] border-t border-[var(--border-color)] shrink-0">
            {replyToId && <ReplyPreview replyToId={replyToId} messages={allMessages} onCancel={() => setReplyToId(null)} />}
            <form onSubmit={handleSendMessage} className="p-3 flex gap-2 items-end">
                <textarea 
                    value={messageText} 
                    onChange={e => setMessageText(e.target.value)} 
                    
                    // --- EVENT HANDLERS FOR INSTANT UPDATES ---
                    onFocus={handleFocus} // Start typing immediately when focused
                    onBlur={handleBlur}   // Trigger "Stop Typing" INSTANTLY when you leave the box
                    onClick={startTyping} // Wake up status if you click inside (even if already focused)
                    
                    onKeyDown={(e) => {
                        handleKeyDown(); // Reset timeout on key press
                        if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                    }}
                    // UPDATED: WhatsApp style placeholder
                    placeholder="💬 Type a message..." 
                    rows={1} 
                    className="flex-1 px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-full shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] resize-none min-h-[45px] max-h-[100px]" 
                />
                {/* UPDATED: Send Button with Pink Style and WhatsApp Arrow Icon */}
                <button 
                    type="submit" 
                    disabled={!messageText.trim()} 
                    className="flex items-center justify-center p-3 text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] rounded-full shadow-md disabled:opacity-50 transition-transform active:scale-95"
                >
                    {/* WhatsApp-style Send Icon (Simple Arrow) */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current -rotate-45" viewBox="0 0 24 24">
                        <path d="M4.697 19.467l14.93-7.465a.5.5 0 000-.864L4.697 3.533a.5.5 0 00-.773.432L4.015 9.5H10a1 1 0 110 2H4.015l-.091 5.535a.5.5 0 00.773.432z" />
                    </svg>
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
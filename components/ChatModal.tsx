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
}

const ChatModal: React.FC<ChatModalProps> = ({ activity, outing, skillRequest, bookingRequest, currentUser, onClose }) => {
  const { t } = useLanguage();
  const [messageText, setMessageText] = useState('');
  const [historyMessages, setHistoryMessages] = useState<ChatMessage[]>([]);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      // Extract photo from booking request (ensure backend mapping puts it there)
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
      return historyMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }, [historyMessages]);

  useEffect(() => {
      if (contextId) {
          chatService.getHistory(contextId).then(setHistoryMessages).catch(console.error);
          socketService.joinRoom(contextId, currentUser.id);
          if (bookingRequest && otherUserId) {
              socketService.checkOnlineStatus(otherUserId, (isOnline) => setIsRecipientOnline(isOnline));
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
          setHistoryMessages(prev => prev.map(m => 
              m.id === data.messageId ? { ...m, deleted: true, plaintext: "🚫 This message was deleted" } : m
          ));
      });

      const unsubClear = socketService.onChatCleared((data) => {
          if (data.roomId === contextId) {
              setHistoryMessages([]);
          }
      });

      const unsubPresence = socketService.onPresenceUpdate((data) => {
           if (data.userId === otherUserId) setIsRecipientOnline(data.status === 'online');
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

      return () => {
          unsubMsg(); unsubReaction(); unsubDelete(); unsubClear(); unsubPresence(); unsubStatus();
          if (contextId) socketService.leaveRoom(contextId);
      };
  }, [contextId, currentUser.id, bookingRequest, otherUserId]);

  useEffect(() => {
    if (allMessages.length > 0) {
         messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [contextId]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (messageText.trim()) {
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
          deleted: false
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

  const scrollToMessage = (msgId: string) => {
      const element = document.getElementById(`msg-${msgId}`);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-yellow-100', 'dark:bg-yellow-900');
          setTimeout(() => element.classList.remove('bg-yellow-100', 'dark:bg-yellow-900'), 1000);
      }
  };

  return (
    <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl w-full max-w-lg h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex justify-between items-center z-10 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
                {/* FIX: Use otherUserPhoto if available, otherwise fallback */}
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
                        {bookingRequest && (
                            <span className={`w-2 h-2 rounded-full ${isRecipientOnline ? 'bg-green-500' : 'bg-gray-400'}`} title={isRecipientOnline ? "Online" : "Offline"}></span>
                        )}
                    </h2>
                </div>
            </div>
            <div className="flex gap-3 items-center">
                <button 
                    onClick={() => { if(window.confirm("Clear entire chat history for everyone?")) socketService.clearChat(contextId); }} 
                    className="text-xs text-red-500 hover:text-red-700 hover:underline font-medium"
                >
                    Clear Chat
                </button>
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
                        onDelete={(id) => { if(window.confirm("Delete message for everyone?")) socketService.deleteMessage(contextId, id); }}
                        onScrollToMessage={scrollToMessage}
                    />
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-[var(--bg-card)] border-t border-[var(--border-color)] shrink-0">
            {replyToId && <ReplyPreview replyToId={replyToId} messages={allMessages} onCancel={() => setReplyToId(null)} />}
            <form onSubmit={handleSendMessage} className="p-3 flex gap-2 items-end">
                <textarea 
                    value={messageText} 
                    onChange={e => setMessageText(e.target.value)} 
                    onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                    placeholder={t('chat_placeholder')} 
                    rows={1} 
                    className="flex-1 px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-full shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)] resize-none min-h-[45px] max-h-[100px]" 
                />
                <button type="submit" disabled={!messageText.trim()} className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white p-3 rounded-full shadow-md disabled:opacity-50 transition-transform active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
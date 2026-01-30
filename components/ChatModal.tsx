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

    // Ref for the scrollable container
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contextId) {
            // ... (existing socket logic) ...
        }

        const unsubMsg = socketService.onMessage(({ roomId, message }) => {
            if (roomId !== contextId) return;
            setHistoryMessages(prev => {
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
            // Auto-scroll logic as requested using scrollTop
            if (scrollContainerRef.current) {
                setTimeout(() => {
                    scrollContainerRef.current!.scrollTop = scrollContainerRef.current!.scrollHeight;
                }, 100);
            }
        });

        // ... (rest of listeners) ...

        return () => {
            unsubMsg(); // ... others
            if (contextId) {
                socketService.sendStopTyping(contextId, currentUser.id, currentUser.fullName);
                socketService.leaveRoom(contextId);
            }
        };
    }, [contextId, currentUser.id, bookingRequest, otherUserId]);

    // Initial scroll on open
    useEffect(() => {
        if (allMessages.length > 0 && scrollContainerRef.current) {
            // Auto-scroll logic as requested
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [contextId, allMessages.length]); // Re-run when messages load

    // ... (typing logic) ...

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (messageText.trim()) {
            stopTyping();

            const tempId = `temp-${Date.now()}`;
            const newMessage: ChatMessage = {
                // ... existing message creation ...
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
            // Auto-scroll logic as requested
            if (scrollContainerRef.current) {
                setTimeout(() => {
                    scrollContainerRef.current!.scrollTop = scrollContainerRef.current!.scrollHeight;
                }, 100);
            }
        }
    };

    // ... (other handlers) ...

    return (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex justify-center items-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.8);
        }
      `}</style>
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>

                {/* Header - Sticky */}
                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex justify-between items-center z-10 shrink-0 shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                        {otherUserId && (
                            <img
                                src={otherUserPhoto || `https://i.pravatar.cc/150?u=${otherUserId}`}
                                className="w-10 h-10 rounded-full object-cover border-2 border-[var(--accent-primary)]/20"
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
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Messages List - Scrollable */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 p-4 overflow-y-auto bg-[#e5ded8] dark:bg-[#0b141a] custom-scrollbar scroll-smooth flex flex-col"
                >
                    <div className="space-y-4 flex flex-col justify-end min-h-0">
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
                    </div>

                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                        <div className="text-xs text-gray-500 italic ml-2 mt-2 sticky bottom-0 transition-opacity duration-200 opacity-100">
                            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </div>
                    )}
                </div>

                {/* Input Area - Sticky */}
                <div className="bg-[var(--bg-card)] border-t border-[var(--border-color)] shrink-0 z-10">
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
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                            }}
                            placeholder="💬 Type a message..."
                            rows={1}
                            className="flex-1 px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:shadow-[0_0_10px_rgba(236,72,153,0.5)] transition-all duration-300 text-[var(--text-primary)] resize-none min-h-[45px] max-h-[100px]"
                        />
                        <button
                            type="submit"
                            disabled={!messageText.trim()}
                            className="flex items-center justify-center p-3 text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] rounded-full shadow-lg shadow-pink-500/30 disabled:opacity-50 transition-all active:scale-95 hover:scale-105"
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
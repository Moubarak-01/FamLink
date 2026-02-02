import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatActivityTitle } from '../utils/textUtils';
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
        title = isParent ? (bookingRequest.nannyName || t('text_nanny')) : (bookingRequest.parentName || t('text_parent'));
        otherUserPhoto = isParent ? (bookingRequest.nannyPhoto || '') : (bookingRequest['parentPhoto'] || '');
    } else if (skillRequest) {
        title = skillRequest.title;
        otherUserPhoto = skillRequest.image || skillRequest.requesterPhoto || '';
    } else if (outing) {
        title = outing.title;
        otherUserPhoto = outing.image || outing.hostPhoto || '';
    } else if (activity) {
        title = formatActivityTitle(activity.category);
        if (activity.participants.length > 2) {
            title += t('text_members_count', { count: activity.participants.length });
        }
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
            socketService.joinRoom(contextId, currentUser.id);

            // Fetch initial history
            chatService.getHistory(contextId)
                .then(msgs => {
                    setHistoryMessages(msgs);
                    // Mark as seen immediately after loading history
                    socketService.markMessagesAsSeen(contextId, currentUser.id);
                })
                .catch(err => console.error("Failed to load chat history:", err));

            // Initial check for presence
            if (otherUserId) {
                socketService.checkOnlineStatus(otherUserId, (data) => {
                    if (data.status === 'online') setIsRecipientOnline(true);
                    else {
                        setIsRecipientOnline(false);
                        setRecipientLastSeen(data.lastSeen);
                    }
                });
            }
        }

        const unsubPresence = socketService.onPresenceUpdate((data) => {
            if (data.userId === otherUserId) {
                if (data.status === 'online') {
                    setIsRecipientOnline(true);
                    setRecipientLastSeen(null);
                } else {
                    setIsRecipientOnline(false);
                    setRecipientLastSeen(data.lastSeen || new Date().toISOString());
                }
            }
        });

        const unsubMsg = socketService.onMessage(({ roomId, message }) => {
            if (roomId !== contextId) return;
            setHistoryMessages(prev => {
                // Deduplication: Check for Real ID
                if (prev.some(m => m.id === message.id)) return prev;

                // Deduplication: If from me, check for Temp ID match (fuzzy match by text/time could be safer, but removing latest temp is easier)
                // Actually, rely on the sendMessage callback to clean up.
                // But we still don't want to show BOTH.
                // If I receive a message from myself via socket, acts as confirmation.
                if (message.senderId === currentUser.id) {
                    // Check if we have a temp message that matches this content
                    const tempMatchIndex = prev.findIndex(m => m.id.startsWith('temp-') && m.text === message.text);
                    if (tempMatchIndex !== -1) {
                        // Replace the temp message with the real one immediately
                        const newHistory = [...prev];
                        newHistory[tempMatchIndex] = message;
                        return newHistory;
                    }
                }

                // If I am receiving a message in this active window from SOMEONE ELSE, mark it as seen immediately
                if (message.senderId !== currentUser.id) {
                    socketService.markMessagesAsSeen(roomId, currentUser.id);
                }
                return [...prev, message];
            });

            // Auto-scroll
            if (scrollContainerRef.current) {
                setTimeout(() => {
                    scrollContainerRef.current!.scrollTop = scrollContainerRef.current!.scrollHeight;
                }, 100);
            }
        });

        // Add Status Update Listener for Blue Ticks
        const unsubStatus = socketService.onStatusUpdate((data) => {
            if (data.roomId === contextId) {
                setHistoryMessages(prev => prev.map(msg => {
                    // Normalize ID comparison (msg.id vs data.messageId)
                    if (data.status === 'seen') {
                        // FIX: Mark messages NOT sent by the viewer (i.e. sent by ME) as seen
                        if (msg.senderId !== data.userId && msg.status !== 'seen') {
                            return { ...msg, status: 'seen' };
                        }
                    } else if (msg.id === data.messageId || (msg as any)._id === data.messageId) {
                        return { ...msg, status: data.status };
                    }
                    return msg;
                }));
            }
        });

        const unsubReaction = socketService.onReaction((data) => {
            if (data.roomId === contextId) {
                setHistoryMessages(prev => prev.map(msg => {
                    const msgId = msg.id || (msg as any)._id;
                    if (msgId === data.messageId) {
                        const currentReactions = msg.reactions || [];
                        if (data.type === 'add') {
                            // Avoid duplicates
                            if (!currentReactions.some(r => r.userId === data.userId && r.emoji === data.emoji)) {
                                return { ...msg, reactions: [...currentReactions, { userId: data.userId, emoji: data.emoji }] };
                            }
                        } else if (data.type === 'remove') {
                            return { ...msg, reactions: currentReactions.filter(r => !(r.userId === data.userId && r.emoji === data.emoji)) };
                        }
                    }
                    return msg;
                }));
            }
        });

        const unsubDelete = socketService.onMessageDeleted((data) => {
            if (data.roomId === contextId) {
                setHistoryMessages(prev => prev.filter(msg => {
                    const msgId = msg.id || (msg as any)._id;
                    return msgId !== data.messageId;
                }));
            }
        });

        const unsubTyping = socketService.onTyping((data) => {
            if (data.roomId === contextId && data.userId !== currentUser.id) {
                if (data.isTyping) {
                    setTypingUsers(prev => !prev.includes(data.userName) ? [...prev, data.userName] : prev);
                } else {
                    setTypingUsers(prev => prev.filter(u => u !== data.userName));
                }
            }
        });

        return () => {
            unsubMsg();
            unsubStatus(); // Unsubscribe status
            unsubReaction(); // Unsubscribe reactions
            unsubDelete(); // Unsubscribe deletions
            unsubTyping(); // Unsubscribe typing
            unsubPresence();
            if (contextId) {
                socketService.sendStopTyping(contextId, currentUser.id, currentUser.fullName);
                socketService.leaveRoom(contextId);
            }
        };
    }, [contextId, currentUser.id, bookingRequest, otherUserId]);

    // Initial scroll on open
    // Initial scroll and Auto-scroll on Typing/Messages
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [contextId, allMessages.length, typingUsers.length]); // Scroll when typing toggles/messages arrive

    // --- TYPING LOGIC ---
    const stopTyping = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        if (contextId) {
            socketService.sendStopTyping(contextId, currentUser.id, currentUser.fullName);
        }
    };

    const startTyping = () => {
        if (!contextId) return;

        const now = Date.now();
        // Throttle sending "typing" event to once every 2 seconds
        if (now - lastTypingSentRef.current > 2000) {
            socketService.sendTyping(contextId, currentUser.id, currentUser.fullName);
            lastTypingSentRef.current = now;
        }

        // Clear existing stop timeout and set a new one
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Auto-stop typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(stopTyping, 3000);
    };

    const handleFocus = () => {
        startTyping();
    };

    const handleBlur = () => {
        // Only stop typing if field is empty (preserve "typing" status if drafting)
        if (!messageText.trim()) {
            stopTyping();
        }
    };

    const handleKeyDown = () => {
        startTyping();
    };

    // --- OTHER HELPERS ---
    const handleDeleteClick = (messageId: string, isMyMessage: boolean) => {
        if (isMyMessage) {
            // If it's my message, ask if delete for all or just me
            // For simplicity in this modal, we trigger the parent handler which likely handles "delete for all"
            // You might want a custom UI here for "Delete for me" vs "Delete for everyone"
            if (window.confirm(t('confirm_delete_message'))) {
                onDeleteMessage(contextId, messageId);
            }
        } else {
            // Delete for me only (local hide)
            onDeleteMessage(contextId, messageId);
        }
    };

    const scrollToMessage = (messageId: string) => {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight effect
            el.classList.add('bg-[var(--accent-primary)]/10');
            setTimeout(() => el.classList.remove('bg-[var(--accent-primary)]/10'), 2000);
        }
    };

    const formatLastSeen = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const now = new Date();
        const diff = (now.getTime() - date.getTime()) / 1000; // seconds

        if (diff < 60) return t('text_just_now');
        if (diff < 3600) return t('text_m_ago', { count: Math.floor(diff / 60) });
        if (diff < 86400) return t('text_h_ago', { count: Math.floor(diff / 3600) });
        return date.toLocaleDateString();
    };

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
                setHistoryMessages(prev => {
                    // Check if Real ID already exists (from socket event replacement)
                    const realId = savedMessage.id || (savedMessage as any)._id?.toString();
                    if (prev.some(m => m.id === realId)) {
                        // Remove the temp message, as Real one is already there
                        return prev.filter(m => m.id !== tempId);
                    }
                    // Otherwise update tempId to savedMessage
                    return prev.map(m => m.id === tempId ? savedMessage : m);
                });
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
                                        <span className="text-green-500 font-medium">● {t('text_online')}</span>
                                    ) : recipientLastSeen ? (
                                        <span>{t('text_last_seen')}{formatLastSeen(recipientLastSeen)}</span>
                                    ) : (
                                        <span>{t('text_offline')}</span>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-3 items-center">
                        <button
                            onClick={() => {
                                if (window.confirm(t('confirm_delete_chat'))) {
                                    onDeleteAllMessages(contextId);
                                }
                            }}
                            className="p-2 rounded-full hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                            title={t('delete_chat')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
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
                    <div className="space-y-2 pt-2 pb-2">
                        <AnimatePresence initial={false} mode='popLayout'>
                            {allMessages.map((msg, index) => {
                                const isSequence = index > 0 && allMessages[index - 1].senderId === msg.senderId;
                                return (
                                    <motion.div
                                        id={`msg-${msg.id}`}
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }} // Start 20px below
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 30,
                                            mass: 1,
                                            delay: isSequence ? 0 : 0.05 // Faster if sequential
                                        }}
                                        layout
                                        className="origin-bottom"
                                    >
                                        <MessageBubble
                                            message={msg}
                                            currentUser={currentUser}
                                            messages={allMessages}
                                            onReaction={(id, emoji) => socketService.sendReaction(contextId, id, currentUser.id, emoji)}
                                            onRemoveReaction={(id, emoji) => socketService.removeReaction(contextId, id, currentUser.id, emoji)}
                                            onReply={(id) => { setReplyToId(id); window.setTimeout(() => document.querySelector('textarea')?.focus(), 100); }}
                                            onDelete={(id) => handleDeleteClick(id, msg.senderId === currentUser.id)}
                                            onScrollToMessage={scrollToMessage}
                                        />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* WhatsApp-Style Dancing Typing Bubble */}
                    <AnimatePresence>
                        {typingUsers.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="self-start ml-4 mb-2"
                            >
                                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-none shadow-md border border-gray-100 dark:border-gray-700 w-fit">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{
                                                duration: 0.6,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                                delay: i * 0.1 // Staggered wave
                                            }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Area - Sticky */}
                <div className="bg-[var(--bg-card)] border-t border-[var(--border-color)] shrink-0 z-10">
                    {replyToId && <ReplyPreview replyToId={replyToId} messages={allMessages} onCancel={() => setReplyToId(null)} />}
                    <form onSubmit={handleSendMessage} className="p-3 flex gap-2 items-end">
                        <textarea
                            value={messageText}
                            onChange={e => {
                                setMessageText(e.target.value);
                                // Trigger typing status on any change (paste, voice, etc.)
                                if (e.target.value.trim()) startTyping();
                            }}

                            // --- EVENT HANDLERS FOR INSTANT UPDATES ---
                            onFocus={handleFocus} // Start typing immediately when focused
                            onBlur={handleBlur}   // Trigger "Stop Typing" INSTANTLY when you leave the box
                            onClick={startTyping} // Wake up status if you click inside (even if already focused)

                            onKeyDown={(e) => {
                                handleKeyDown(); // Reset timeout on key press
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                            }}
                            placeholder={t('placeholder_chat_input')}
                            rows={1}
                            className={`flex-1 px-4 py-3 bg-[var(--bg-input)] border rounded-full shadow-sm 
                                transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none min-h-[45px] max-h-[100px]
                                focus:outline-none focus:bg-pink-50 dark:focus:bg-[#1a1a1a] 
                                border-[var(--border-input)] focus:border-pink-300 focus:shadow-[0_0_15px_rgba(236,72,153,0.3)]
                            `}
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
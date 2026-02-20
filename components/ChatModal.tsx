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
    onDeleteAllMessages?: (contextId: string) => void;
    onReportUser?: (userId: string) => void;
    onStartCall?: (userId: string, type?: 'video' | 'voice', name?: string) => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ activity, outing, skillRequest, bookingRequest, currentUser, onClose, onDeleteMessage, onDeleteAllMessages, onReportUser, onStartCall }) => {
    const { t } = useLanguage();
    const [messageText, setMessageText] = useState('');
    const [historyMessages, setHistoryMessages] = useState<ChatMessage[]>([]);
    const [replyToId, setReplyToId] = useState<string | null>(null);

    // New States for Online/Typing status
    const [isRecipientOnline, setIsRecipientOnline] = useState(false);
    const [recipientLastSeen, setRecipientLastSeen] = useState<string | null>(null);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);

    // NEW: Quick scroll button state
    const [showScrollButton, setShowScrollButton] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Ref to track the last time we sent a "typing" signal (prevents spamming)
    const lastTypingSentRef = useRef<number>(0);

    // NEW: Date grouping helper
    const formatDateHeader = (timestamp: number): string => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return t('today');
        } else if (date.toDateString() === yesterday.toDateString()) {
            return t('yesterday');
        } else {
            return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
        }
    };

    const shouldShowDateHeader = (messages: ChatMessage[], index: number): boolean => {
        if (index === 0) return true;
        const currentDate = new Date(messages[index].timestamp || 0).toDateString();
        const prevDate = new Date(messages[index - 1].timestamp || 0).toDateString();
        return currentDate !== prevDate;
    };

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
        // Allow calling the requester (1-on-1 style, or if only 2 participants)
        const reqId = typeof skillRequest.requesterId === 'string' ? skillRequest.requesterId : skillRequest.requesterId?.id || skillRequest.requesterId?._id;
        if (reqId && reqId !== currentUser.id) {
            otherUserId = reqId;
        }
    } else if (outing) {
        title = outing.title;
        otherUserPhoto = outing.image || outing.hostPhoto || '';
        // Allow calling the host
        const outingHostId = typeof outing.hostId === 'string' ? outing.hostId : outing.hostId?.id || outing.hostId?._id;
        if (outingHostId && outingHostId !== currentUser.id) {
            otherUserId = outingHostId;
        }
    } else if (activity) {
        title = formatActivityTitle(activity.category);
        if (activity.participants.length > 2) {
            title += t('text_members_count', { count: activity.participants.length });
        }
        otherUserPhoto = activity.image || activity.hostPhoto || '';
        // Allow calling the host (or another participant if it's a 2-person chat)
        if (activity.hostId && activity.hostId !== currentUser.id) {
            otherUserId = typeof activity.hostId === 'string' ? activity.hostId : activity.hostId.id || activity.hostId._id;
        } else if (activity.participants.length === 2) {
            // Find the other participant (participants is string[])
            const otherParticipant = activity.participants.find(p => p !== currentUser.id);
            if (otherParticipant) {
                otherUserId = otherParticipant;
            }
        }
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

        // Lock body scroll when modal is open
        document.body.style.overflow = 'hidden';

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

                if (message.senderId === currentUser.id) {
                    const tempMatchIndex = prev.findIndex(m => m.id.startsWith('temp-') && m.text === message.text);
                    if (tempMatchIndex !== -1) {
                        const newHistory = [...prev];
                        newHistory[tempMatchIndex] = message;
                        return newHistory;
                    }
                }

                if (message.senderId !== currentUser.id) {
                    socketService.markMessagesAsSeen(roomId, currentUser.id);
                }

                // Ensure timestamp exists to prevent it from jumping to the top of the chat
                const processedMessage = {
                    ...message,
                    timestamp: message.timestamp || Date.now()
                };

                return [...prev, processedMessage];
            });

            if (scrollContainerRef.current) {
                setTimeout(() => {
                    scrollContainerRef.current!.scrollTop = scrollContainerRef.current!.scrollHeight;
                }, 100);
            }
        });

        const unsubStatus = socketService.onStatusUpdate((data) => {
            if (data.roomId === contextId) {
                setHistoryMessages(prev => prev.map(msg => {
                    if (data.status === 'seen') {
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
            document.body.style.overflow = 'unset';
            unsubMsg();
            unsubStatus();
            unsubReaction();
            unsubDelete();
            unsubTyping();
            unsubPresence();
            if (contextId) {
                socketService.sendStopTyping(contextId, currentUser.id, currentUser.fullName);
                socketService.leaveRoom(contextId);
            }
        };
    }, [contextId, currentUser.id, bookingRequest, otherUserId]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [contextId, allMessages.length, typingUsers.length]);

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
        if (now - lastTypingSentRef.current > 2000) {
            socketService.sendTyping(contextId, currentUser.id, currentUser.fullName);
            lastTypingSentRef.current = now;
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(stopTyping, 3000);
    };

    const handleFocus = () => {
        startTyping();
    };

    const handleBlur = () => {
        if (!messageText.trim()) {
            stopTyping();
        }
    };

    const handleKeyDown = () => {
        startTyping();
    };

    const handleDeleteClick = (messageId: string, isMyMessage: boolean) => {
        if (isMyMessage) {
            if (window.confirm(t('confirm_delete_message'))) {
                onDeleteMessage(contextId, messageId);
            }
        } else {
            onDeleteMessage(contextId, messageId);
        }
    };

    const scrollToMessage = (messageId: string) => {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('bg-[var(--accent-primary)]/10');
            setTimeout(() => el.classList.remove('bg-[var(--accent-primary)]/10'), 2000);
        }
    };

    const formatLastSeen = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const now = new Date();
        const diff = (now.getTime() - date.getTime()) / 1000;

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
                    const realId = savedMessage.id || (savedMessage as any)._id?.toString();
                    if (prev.some(m => m.id === realId)) {
                        return prev.filter(m => m.id !== tempId);
                    }
                    return prev.map(m => m.id === tempId ? savedMessage : m);
                });
            });

            setMessageText('');
            setReplyToId(null);
            if (scrollContainerRef.current) {
                setTimeout(() => {
                    scrollContainerRef.current!.scrollTop = scrollContainerRef.current!.scrollHeight;
                }, 100);
            }
        }
    };

    // NEW: Handle scroll events for quick scroll button
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            setShowScrollButton(distanceFromBottom > 200);
        }
    };

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

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
            <div
                className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden border border-[var(--border-color)]"
                onClick={e => e.stopPropagation()}
                onWheel={e => e.stopPropagation()}
                data-lenis-prevent
            >

                {/* Header - Sticky */}
                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--chat-nav-bg)] flex justify-between items-center z-10 shrink-0 shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                        {otherUserId && (
                            <img
                                src={otherUserPhoto || `https://i.pravatar.cc/150?u=${otherUserId}`}
                                className="w-10 h-10 rounded-full object-cover border-2 border-[var(--accent-primary)]/20"
                                alt="avatar"
                            />
                        )}
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-black dark:text-[var(--text-primary)] truncate flex items-center gap-2">
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
                        {/* Voice Call Button */}
                        {onStartCall && otherUserId && (
                            <button
                                onClick={() => onStartCall(otherUserId, 'voice', title)}
                                className="p-2 rounded-full hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] transition-colors"
                                title={t('start_voice_call') || 'Start Voice Call'}
                            >
                                📞
                            </button>
                        )}
                        {/* Video Call Button */}
                        {onStartCall && otherUserId && (
                            <button
                                onClick={() => onStartCall(otherUserId, 'video', title)}
                                className="p-2 rounded-full hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] transition-colors"
                                title={t('start_video_call')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        )}

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
                    onScroll={handleScroll}
                    className="flex-1 p-4 overflow-y-auto bg-[var(--chat-bg)] custom-scrollbar scroll-smooth flex flex-col relative overscroll-contain"
                >
                    <div className="space-y-2 pt-2 pb-2">
                        <AnimatePresence initial={false} mode='popLayout'>
                            {allMessages.map((msg, index) => {
                                const isSequence = index > 0 && allMessages[index - 1].senderId === msg.senderId && !shouldShowDateHeader(allMessages, index);
                                const showDateHeader = shouldShowDateHeader(allMessages, index);

                                return (
                                    <React.Fragment key={msg.id}>
                                        {/* Date Header */}
                                        {showDateHeader && (
                                            <div className="flex justify-center my-4">
                                                <span className="bg-[var(--chat-nav-bg)] opacity-90 text-[var(--text-secondary)] text-xs px-4 py-1.5 rounded-full shadow-sm backdrop-blur-sm">
                                                    {formatDateHeader(msg.timestamp || Date.now())}
                                                </span>
                                            </div>
                                        )}
                                        <motion.div
                                            id={`msg-${msg.id}`}
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 500,
                                                damping: 30,
                                                mass: 1,
                                                delay: isSequence ? 0 : 0.05
                                            }}
                                            layout
                                            className={`origin-bottom ${isSequence ? 'mt-0.5' : ''}`}
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
                                    </React.Fragment>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Quick Scroll Button */}
                    <AnimatePresence>
                        {showScrollButton && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                                onClick={scrollToBottom}
                                className="fixed bottom-32 right-8 w-12 h-12 rounded-full bg-[var(--chat-nav-bg)] shadow-xl border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all z-30"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </motion.button>
                        )}
                    </AnimatePresence>

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
                                <div className="flex items-center gap-1 bg-[var(--chat-bubble-received)] px-4 py-3 rounded-2xl rounded-bl-none shadow-md border border-[var(--border-color)] w-fit">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{
                                                duration: 0.6,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                                delay: i * 0.1
                                            }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input Area - Sticky */}
                <div className="bg-[var(--chat-nav-bg)] border-t border-[var(--border-color)] shrink-0 z-10">
                    {replyToId && <ReplyPreview replyToId={replyToId} messages={allMessages} onCancel={() => setReplyToId(null)} />}
                    <form onSubmit={handleSendMessage} className="p-3 flex gap-2 items-end">
                        <textarea
                            value={messageText}
                            onChange={e => {
                                setMessageText(e.target.value);
                                if (e.target.value.trim()) startTyping();
                            }}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onClick={startTyping}
                            onKeyDown={(e) => {
                                handleKeyDown();
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                            }}
                            placeholder={t('placeholder_chat_input')}
                            rows={1}
                            className={`flex-1 px-4 py-3 bg-[var(--chat-input-bg)] border rounded-full shadow-sm 
                                            transition-all duration-300 text-[var(--chat-text-primary)] placeholder-gray-500 resize-none min-h-[45px] max-h-[100px]
                                            focus:outline-none focus:bg-[var(--chat-input-bg)]
                                            border-[var(--border-input)] focus:border-[var(--accent-primary)] focus:shadow-[0_0_15px_rgba(236,72,153,0.3)]
                                        `}
                        />
                        <button
                            type="submit"
                            disabled={!messageText.trim()}
                            className="flex items-center justify-center p-3 text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] rounded-full shadow-lg shadow-pink-500/30 disabled:opacity-50 transition-all active:scale-95 hover:scale-105"
                        >
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
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { callLogService, CallLogEntry } from '../../services/callLogService';

interface CallHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
    onCallUser?: (userId: string, type?: 'video' | 'voice', name?: string) => void;
}

const CallHistoryModal: React.FC<CallHistoryModalProps> = ({ isOpen, onClose, currentUserId, onCallUser }) => {
    const { t } = useLanguage();
    const [calls, setCalls] = useState<CallLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && currentUserId) {
            loadCallHistory();
        }
    }, [isOpen, currentUserId]);

    const loadCallHistory = async () => {
        setLoading(true);
        try {
            const history = await callLogService.getCallHistory(currentUserId);
            setCalls(history);
        } catch (error) {
            console.error('Failed to load call history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = async () => {
        if (window.confirm(t('confirm_clear_call_history') || 'Clear all call history?')) {
            try {
                await callLogService.clearCallHistory(currentUserId);
                setCalls([]);
            } catch (error) {
                console.error('Failed to clear call history:', error);
            }
        }
    };

    const getCallIcon = (call: CallLogEntry) => {
        const isOutgoing = call.callerId === currentUserId;

        if (call.status === 'missed') return { icon: '📵', color: 'text-red-500' };
        if (call.status === 'rejected') return { icon: '🚫', color: 'text-red-500' };
        if (call.status === 'no_answer') return { icon: '📴', color: 'text-yellow-500' };

        if (isOutgoing) {
            return { icon: '📤', color: 'text-green-500' };
        }
        return { icon: '📥', color: 'text-blue-500' };
    };

    const getStatusText = (call: CallLogEntry) => {
        switch (call.status) {
            case 'missed': return t('call_missed') || 'Missed';
            case 'rejected': return t('call_declined') || 'Declined';
            case 'no_answer': return t('call_no_answer') || 'No Answer';
            case 'completed': return callLogService.formatDuration(call.duration);
            default: return '';
        }
    };

    const formatTime = (date: Date | string) => {
        const d = new Date(date);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();

        if (isToday) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const getOtherParty = (call: CallLogEntry) => {
        const isOutgoing = call.callerId === currentUserId;
        return {
            id: isOutgoing ? call.receiverId : call.callerId,
            name: isOutgoing ? call.receiverName : call.callerName,
            photo: isOutgoing ? call.receiverPhoto : call.callerPhoto
        };
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden border border-[var(--border-color)]"
                    onClick={(e) => e.stopPropagation()}
                    onWheel={(e) => e.stopPropagation()}
                    data-lenis-prevent
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            📞 {t('calls_tab') || 'Calls'}
                        </h2>
                        <div className="flex items-center gap-2">
                            {calls.length > 0 && (
                                <button
                                    onClick={handleClearHistory}
                                    className="text-white/80 hover:text-white text-sm px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition"
                                >
                                    {t('clear_history') || 'Clear'}
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="text-white/80 hover:text-white text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Call List */}
                    <div className="overflow-y-auto max-h-[60vh] p-2 overscroll-contain">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full"></div>
                            </div>
                        ) : calls.length === 0 ? (
                            <div className="text-center py-12 text-[var(--text-secondary)]">
                                <div className="text-5xl mb-4">📞</div>
                                <p>{t('no_calls') || 'No recent calls'}</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {calls.map((call) => {
                                    const { icon, color } = getCallIcon(call);
                                    const otherParty = getOtherParty(call);

                                    return (
                                        <motion.div
                                            key={call.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-hover)] transition-all cursor-pointer group"
                                            onClick={() => onCallUser?.(otherParty.id, call.callType as 'video' | 'voice')}
                                        >
                                            {/* Avatar */}
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                                    {otherParty.photo ? (
                                                        <img
                                                            src={otherParty.photo}
                                                            alt={otherParty.name}
                                                            className="w-full h-full object-cover rounded-full"
                                                        />
                                                    ) : (
                                                        otherParty.name?.charAt(0).toUpperCase() || '?'
                                                    )}
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 text-sm ${color}`}>
                                                    {icon}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-[var(--text-primary)] truncate">
                                                    {otherParty.name || 'Unknown User'}
                                                </p>
                                                <p className={`text-sm ${call.status === 'missed' || call.status === 'rejected' ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
                                                    {call.callType === 'video' ? '📹' : '📱'} {getStatusText(call)}
                                                </p>
                                            </div>

                                            {/* Time & Call Button */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-[var(--text-secondary)]">
                                                    {formatTime(call.startedAt)}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCallUser?.(otherParty.id, call.callType as 'video' | 'voice');
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all"
                                                >
                                                    📞
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence >
    );
};

export default CallHistoryModal;

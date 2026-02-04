import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callLogService, CallLogEntry } from '../../services/callLogService';
import { useLanguage } from '../../contexts/LanguageContext';

interface CallsTabProps {
    currentUserId: string;
    onCallUser: (userId: string) => void;
}

const CallsTab: React.FC<CallsTabProps> = ({ currentUserId, onCallUser }) => {
    const { t } = useLanguage();
    const [calls, setCalls] = useState<CallLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCalls();
    }, [currentUserId]);

    const loadCalls = async () => {
        setLoading(true);
        const history = await callLogService.getCallHistory(currentUserId);
        setCalls(history);
        setLoading(false);
    };

    const handleClearHistory = async () => {
        if (window.confirm(t('confirm_clear_call_history') || 'Clear all call history?')) {
            await callLogService.clearCallHistory(currentUserId);
            setCalls([]);
        }
    };

    const getCallIcon = (call: CallLogEntry): string => {
        const isOutgoing = call.callerId === currentUserId;

        if (call.status === 'missed' || call.status === 'no_answer') {
            return isOutgoing ? '📞↗️' : '📞❌';
        }
        if (call.status === 'rejected') {
            return '📞⛔';
        }
        return isOutgoing ? '📞↗️' : '📞↙️';
    };

    const getCallStatusColor = (call: CallLogEntry): string => {
        if (call.status === 'missed' || call.status === 'no_answer') {
            return 'text-red-500';
        }
        if (call.status === 'rejected') {
            return 'text-orange-500';
        }
        return 'text-green-500';
    };

    const getOtherParty = (call: CallLogEntry) => {
        const isOutgoing = call.callerId === currentUserId;
        return {
            name: isOutgoing ? call.receiverName : call.callerName,
            photo: isOutgoing ? call.receiverPhoto : call.callerPhoto,
            id: isOutgoing ? call.receiverId : call.callerId,
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    {t('calls_tab') || 'Calls'}
                </h2>
                {calls.length > 0 && (
                    <button
                        onClick={handleClearHistory}
                        className="text-sm text-red-500 hover:text-red-600 transition-colors"
                    >
                        {t('clear_history') || 'Clear'}
                    </button>
                )}
            </div>

            {/* Call List */}
            <div className="flex-1 overflow-y-auto">
                {calls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-[var(--text-secondary)]">
                        <span className="text-4xl mb-2">📞</span>
                        <p>{t('no_calls') || 'No recent calls'}</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {calls.map((call, index) => {
                            const otherParty = getOtherParty(call);
                            const isOutgoing = call.callerId === currentUserId;

                            return (
                                <motion.div
                                    key={call.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center gap-3 p-4 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer border-b border-[var(--border-color)]/30"
                                    onClick={() => onCallUser(otherParty.id)}
                                >
                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold overflow-hidden">
                                            {otherParty.photo ? (
                                                <img src={otherParty.photo} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                otherParty.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm ${getCallStatusColor(call)}`}>
                                                {getCallIcon(call)}
                                            </span>
                                            <span className="font-medium text-[var(--text-primary)] truncate">
                                                {otherParty.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                            <span>
                                                {call.status === 'completed'
                                                    ? callLogService.formatDuration(call.duration)
                                                    : call.status === 'missed'
                                                        ? (t('call_missed') || 'Missed')
                                                        : call.status === 'rejected'
                                                            ? (t('call_declined') || 'Declined')
                                                            : (t('call_no_answer') || 'No answer')}
                                            </span>
                                            <span>•</span>
                                            <span>{callLogService.formatCallTime(call.createdAt)}</span>
                                        </div>
                                    </div>

                                    {/* Call Type Icon */}
                                    <div className="text-[var(--accent-primary)]">
                                        {call.callType === 'video' ? '📹' : '📞'}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default CallsTab;

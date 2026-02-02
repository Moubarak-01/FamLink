import React, { useState, useMemo } from 'react';
import { SharedOuting, User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import Calendar from './Calendar';
import DeleteButton from './DeleteButton';

// Helper to safely get requestor name
const getRequesterName = (id: any, name: string | undefined, t: any) => {
    if (typeof id === 'object' && id?.fullName) return id.fullName;
    if (name) return name;
    return t('text_unknown_parent');
};

interface ChildOutingScreenProps {
    user: User;
    outings: SharedOuting[];
    onBack: () => void;
    onCreateOuting: () => void;
    onRequestJoin: (outing: SharedOuting) => void;
    onUpdateRequestStatus: (outingId: string, parentId: string, status: 'accepted' | 'declined') => void; // Added Prop
    onOpenChat: (outing: SharedOuting) => void;
    onDeleteOuting: (id: string) => void;
    onDeleteAllOutings: () => void;
    onRateHost?: (hostId: string) => void;
}

// Helper to safely get host name
const getHostName = (hostId: any, hostName: string | undefined, t: any) => {
    if (typeof hostId === 'object' && hostId?.fullName) return hostId.fullName;
    if (hostName) return hostName;
    return t('text_unknown_host');
};

// Helper to safely get host photo
const getHostPhoto = (hostId: any, hostPhoto?: string) => {
    if (typeof hostId === 'object' && hostId?.photo) return hostId.photo;
    if (hostPhoto) return hostPhoto;
    return 'https://i.pravatar.cc/150?u=default';
};

const OutingCard: React.FC<{
    outing: SharedOuting,
    currentUserId: string,
    onRequestJoin: (outing: SharedOuting) => void,
    onUpdateStatus: (outingId: string, parentId: string, status: 'accepted' | 'declined') => void, // Added Prop
    onChat: (outing: SharedOuting) => void,
    onDelete: (id: string) => void
}> = ({ outing, currentUserId, onRequestJoin, onUpdateStatus, onChat, onDelete }) => {
    const { t } = useLanguage();

    // CRITICAL FIX: Safety check for requests array to prevent crash
    const requests = outing.requests || [];

    // FIX: Handle null hostId safely
    if (!outing.hostId) return null;
    const hostIdStr = typeof outing.hostId === 'object' ? (outing.hostId as any)._id : outing.hostId;
    const isHost = hostIdStr === currentUserId;

    const myRequest = requests.find(r => r.parentId === currentUserId);
    const hasRequested = !!myRequest;
    const isAccepted = myRequest?.status === 'accepted';
    const canChat = isHost || isAccepted;

    const displayHostName = getHostName(outing.hostId, outing.hostName, t);
    const displayHostPhoto = getHostPhoto(outing.hostId, outing.hostPhoto);

    const acceptedCount = requests.filter(r => r.status === 'accepted').length;
    const slotsLeft = Math.max(0, outing.maxChildren - acceptedCount);

    return (
        <div className="bg-[var(--bg-card)] rounded-lg shadow-md overflow-hidden border border-[var(--border-color)] relative group transition-all hover:shadow-lg">
            {/* ... Delete Button ... */}
            {isHost && (
                <DeleteButton
                    onDelete={() => onDelete(outing.id)}
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
            )}

            {outing.image && (
                <div className="w-full h-48 bg-gray-100">
                    <img src={outing.image} alt={outing.title} className="w-full h-full object-cover" />
                </div>
            )}

            <div className="p-5">
                <div className="flex items-start gap-4">
                    <img src={displayHostPhoto} alt={displayHostName} className="w-12 h-12 rounded-full object-cover border-2 border-teal-100" />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">{outing.title}</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">{t('outing_card_hosted_by', { name: displayHostName })}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4 mr-8">
                                <p className="text-sm font-bold text-[var(--text-primary)]">
                                    {new Date(outing.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </p>
                                <p className="text-sm text-[var(--text-secondary)]">{outing.time}</p>
                            </div>
                        </div>

                        <p className="text-[var(--text-secondary)] mt-3 text-sm line-clamp-2">{outing.description}</p>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-md border border-teal-100">
                                📍 {outing.location}
                            </span>
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">
                                💰 {outing.costDetails}
                            </span>
                            {outing.liveLocationEnabled && (
                                <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md border border-red-100 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> {t('text_live_location')}
                                </span>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <p className={`text-xs font-bold ${slotsLeft > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {slotsLeft > 0 ? t('outing_card_slots_available', { count: slotsLeft }) : t('text_full')}
                                </p>
                                {hasRequested && (
                                    <p className="text-xs text-[var(--text-light)] mt-1">
                                        Status: <span className={`capitalize font-medium ${myRequest?.status === 'accepted' ? 'text-green-600' : 'text-yellow-600'}`}>{myRequest?.status}</span>
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                    onClick={() => onChat(outing)}
                                    disabled={!canChat}
                                    className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    title={!canChat ? t('tooltip_join_chat') : ""}
                                >
                                    <span>💬</span> {t('activity_card_chat')}
                                </button>

                                {!isHost && (
                                    <button
                                        onClick={() => onRequestJoin(outing)}
                                        disabled={hasRequested || slotsLeft === 0}
                                        className={`font-bold py-1.5 px-4 rounded-full text-xs shadow-sm transition-transform active:scale-95 
                                            ${hasRequested
                                                ? (myRequest?.status === 'accepted' ? 'bg-green-100 text-green-600 cursor-default' :
                                                    myRequest?.status === 'declined' ? 'bg-red-100 text-red-600 cursor-default' :
                                                        'bg-gray-100 text-gray-500 cursor-default')
                                                : 'bg-teal-500 hover:bg-teal-600 text-white hover:scale-105'
                                            }`}
                                    >
                                        {hasRequested
                                            ? (myRequest?.status === 'accepted' ? t('status_accepted') :
                                                myRequest?.status === 'declined' ? t('status_declined') :
                                                    t('outing_card_requested'))
                                            : (outing.privacy === 'public' ? t('outing_card_join') : t('outing_card_request_to_join'))
                                        }
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* HOST SECTION: Manage Requests */}
                        {isHost && (
                            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                                <h4 className="text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">{t('title_manage_requests')} ({requests.length})</h4>
                                {requests.length > 0 ? (
                                    <ul className="space-y-2">
                                        {requests.map((req, idx) => (
                                            <li key={idx} className="bg-[var(--bg-background)] p-2 rounded-md flex justify-between items-center text-sm border border-[var(--border-color)]">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden">
                                                        {req.childName ? req.childName[0].toUpperCase() : '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-[var(--text-primary)]">{req.childName} <span className="text-[var(--text-light)] text-xs">({req.childAge}y)</span></p>
                                                        <p className="text-xs text-[var(--text-secondary)]">{t('label_parent')} {getRequesterName(req.parentId, undefined, t)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    {req.status === 'pending' ? (
                                                        <>
                                                            <button onClick={() => onUpdateStatus(outing.id, (typeof req.parentId === 'object' ? (req.parentId as any)._id : req.parentId), 'accepted')} className="p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200" title="Accept">✔</button>
                                                            <button onClick={() => onUpdateStatus(outing.id, (typeof req.parentId === 'object' ? (req.parentId as any)._id : req.parentId), 'declined')} className="p-1.5 bg-red-100 text-red-700 rounded-full hover:bg-red-200" title="Decline">✖</button>
                                                        </>
                                                    ) : (
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${req.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {req.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-[var(--text-light)] italic">{t('text_no_requests')}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChildOutingScreen: React.FC<ChildOutingScreenProps> = ({
    user, outings, onBack, onCreateOuting, onRequestJoin, onUpdateRequestStatus, onOpenChat, onDeleteOuting, onDeleteAllOutings
}) => {
    const { t } = useLanguage();
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleClearAll = async () => {
        if (window.confirm("Delete ALL outings? This cannot be undone.")) {
            onDeleteAllOutings();
        }
    };

    const displayedOutings = useMemo(() => {
        let filtered = outings;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(o =>
                o.title.toLowerCase().includes(query) ||
                o.description.toLowerCase().includes(query) ||
                o.location.toLowerCase().includes(query)
            );
        }

        if (viewMode === 'calendar' && selectedDate) {
            return filtered.filter(o => o.date === selectedDate);
        }
        return filtered;
    }, [outings, viewMode, selectedDate, searchQuery]);

    const outingDates = useMemo(() => outings.map(o => o.date), [outings]);

    return (
        <div className="p-4 sm:p-8">
            <div className="flex justify-between items-center mb-4">
                <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1">
                    <span>←</span> {t('button_back')}
                </button>

                <button
                    onClick={handleClearAll}
                    className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-200 bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors"
                >
                    {t('button_clear_all')}
                </button>
            </div>

            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{t('child_outings_title')}</h2>
                <p className="text-[var(--text-secondary)] max-w-xl mx-auto">{t('child_outings_subtitle')}</p>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                <div className="relative w-full max-w-md">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('placeholder_search_outings')}
                        className="w-full px-4 py-3 pl-10 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-[var(--text-primary)]"
                    />
                    <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
                </div>

                <button
                    onClick={onCreateOuting}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform hover:scale-105 flex items-center gap-2 whitespace-nowrap"
                >
                    <span>➕</span> {t('button_create_outing')}
                </button>

                <div className="flex items-center bg-[var(--bg-card-subtle)] rounded-lg p-1 border border-[var(--border-color)]">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        {t('community_view_list')}
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'calendar' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        {t('community_view_calendar')}
                    </button>
                </div>
            </div>

            {viewMode === 'calendar' && (
                <div className="mb-8 max-w-md mx-auto">
                    <Calendar
                        availableDates={outingDates}
                        isEditable={false}
                        onDateChange={(date) => setSelectedDate(prev => prev === date ? null : date)}
                    />
                    {selectedDate && (
                        <p className="text-center mt-2 text-sm text-[var(--text-secondary)]">
                            {t('text_showing_events_for')} <span className="font-bold">{selectedDate}</span>
                        </p>
                    )}
                </div>
            )}

            <div className="space-y-6">
                {displayedOutings.length > 0 ? (
                    displayedOutings.map(outing => (
                        <OutingCard
                            key={outing.id}
                            outing={outing}
                            currentUserId={user.id}
                            onRequestJoin={onRequestJoin}
                            onUpdateStatus={onUpdateRequestStatus} // Passed prop
                            onChat={onOpenChat}
                            onDelete={onDeleteOuting}
                        />
                    ))
                ) : (
                    <div className="text-center bg-[var(--bg-card-subtle)] rounded-xl border-2 border-dashed border-[var(--border-color)] p-12">
                        <span className="text-4xl block mb-2">🌳</span>
                        <p className="text-[var(--text-light)] font-medium">
                            {selectedDate
                                ? t('community_no_activities_for_date')
                                : t('text_no_outings_yet')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChildOutingScreen;